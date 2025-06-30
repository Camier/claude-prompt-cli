const fetch = require('node-fetch');
const BaseProvider = require('./base-provider');

/**
 * Ollama Provider
 * Supports local LLM inference via Ollama
 */
class OllamaProvider extends BaseProvider {
  constructor(config = {}) {
    super('ollama', config);
    this.baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = config.defaultModel || process.env.OLLAMA_DEFAULT_MODEL || 'llama3.2:1b';
    this.timeout = config.timeout || 120000; // 2 minutes default
    this.availableModels = null; // Will be populated on first use
    
    // Ollama doesn't have strict rate limits for local inference
    this.rateLimits = {
      requestsPerHour: 10000,
      requestsPerMinute: 1000,
      tokensPerMinute: 100000
    };
  }

  /**
   * Get best available model for a given mode
   */
  async getBestModelForMode(mode) {
    try {
      if (!this.availableModels) {
        this.availableModels = await this.listModels();
      }
      
      const modelNames = this.availableModels.map(m => m.id);
      
      // If no models available, return default
      if (modelNames.length === 0) {
        console.warn('No Ollama models found. Use "ollama pull <model>" to install models.');
        return this.defaultModel;
      }
      
      // Preferred models by mode
      const preferences = {
        coding: ['codellama', 'deepseek-coder', 'codegemma', 'starcoder', 'llama3.2', 'llama3', 'llama2', 'mistral'],
        ultrathink: ['llama3.2:3b', 'llama3:8b', 'llama2:13b', 'llama2:7b', 'mistral', 'neural-chat'],
        creative: ['neural-chat', 'llama3.2', 'llama3', 'mistral', 'llama2'],
        analysis: ['mistral', 'llama3.2', 'llama3', 'llama2', 'mixtral'],
        balanced: ['llama3.2', 'llama3', 'llama2', 'mistral', 'neural-chat']
      };
      
      const modePrefs = preferences[mode] || preferences.balanced;
      
      // Find first available model from preferences
      for (const pref of modePrefs) {
        const match = modelNames.find(name => name.startsWith(pref));
        if (match) return match;
      }
      
      // If no preferred model found, return first available
      return modelNames[0];
    } catch (error) {
      console.warn(`Failed to detect models: ${error.message}. Using default.`);
      return this.defaultModel;
    }
  }

  /**
   * Initialize and check Ollama connection
   */
  async initialize() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Ollama server returned ${response.status}`);
      }
      
      const version = await response.json();
      console.log(`Connected to Ollama version: ${version.version}`);
      return true;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama is not running. Please start Ollama with: ollama serve');
      }
      if (error.name === 'AbortError') {
        throw new Error('Ollama connection timeout - server may be starting up');
      }
      console.error('Ollama connection error details:', error);
      throw new Error(`Failed to connect to Ollama: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * List available models in Ollama
   */
  async listModels() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status}`);
      }
      
      const data = await response.json();
      return data.models.map(model => ({
        id: model.name,
        name: model.name,
        size: this.formatSize(model.size),
        modified: model.modified_at,
        family: model.details?.family || 'unknown',
        parameters: model.details?.parameter_size || 'unknown',
        quantization: model.details?.quantization_level || 'unknown'
      }));
    } catch (error) {
      throw new Error(`Failed to list models: ${this.formatError(error)}`);
    }
  }

  /**
   * Pull a model if not available
   */
  async pullModel(modelName) {
    console.log(`\n📥 Downloading model ${modelName}...`);
    console.log(`This is a one-time download that may take a few minutes.`);
    console.log(`Future requests will be instant!\n`);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.status}`);
      }
      
      // Stream the response to show progress
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status) {
              process.stdout.write(`\r${data.status}${data.completed ? ` ${this.formatSize(data.completed)}/${this.formatSize(data.total)}` : ''}`);
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      }
      
      console.log(`\nModel ${modelName} pulled successfully!`);
      return true;
    } catch (error) {
      throw new Error(`Failed to pull model: ${this.formatError(error)}`);
    }
  }

  /**
   * Generate completion using Ollama
   */
  async complete(prompt, options = {}) {
    const model = options.model || this.defaultModel || await this.getBestModelForMode('balanced');
    
    // Check rate limits
    this.checkRateLimits();
    
    // Check if model exists, if not try to pull it
    const models = await this.listModels();
    const modelExists = models.some(m => m.id === model);
    
    if (!modelExists) {
      console.log(`Model ${model} not found locally.`);
      const shouldPull = options.autoPull !== false;
      
      if (shouldPull) {
        await this.pullModel(model);
      } else {
        throw new Error(`Model ${model} not found. Use --pull to download it.`);
      }
    }
    
    try {
      const requestBody = {
        model: model,
        prompt: prompt,
        stream: options.stream || false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          top_k: options.top_k || 40,
          num_predict: options.max_tokens || 2048,
          stop: options.stop || null,
          seed: options.seed || null
        }
      };
      
      if (options.system) {
        requestBody.system = options.system;
      }
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${error}`);
      }
      
      if (options.stream) {
        // Return stream for handling elsewhere
        return response.body;
      }
      
      const result = await response.json();
      
      // Track usage
      const tokens = this.estimateTokens(prompt) + this.estimateTokens(result.response);
      this.trackUsage(tokens);
      
      return result.response;
    } catch (error) {
      throw new Error(`Ollama completion failed: ${this.formatError(error)}`);
    }
  }

  /**
   * Enhanced prompt generation for Ollama
   */
  async enhance(prompt, mode, options = {}) {
    // For Ollama, we'll use more specific prompts optimized for open models
    const enhancementPrompts = {
      balanced: `You are a helpful AI assistant. Please enhance the following prompt to be more clear, structured, and comprehensive. Provide specific details and context where appropriate.

Original prompt: ${prompt}

Enhanced prompt:`,
      
      ultrathink: `You are an AI that excels at deep, systematic thinking. Transform the following prompt into a comprehensive reasoning framework that includes:
1. Problem decomposition
2. Step-by-step analysis
3. Critical assumptions to examine
4. Alternative perspectives to consider
5. Validation methods

Original prompt: ${prompt}

Enhanced prompt with deep reasoning framework:`,
      
      coding: `You are an expert programming assistant. Enhance the following coding request with:
1. Clear technical specifications
2. Input/output examples
3. Edge cases to consider
4. Performance requirements
5. Best practices to follow

Original prompt: ${prompt}

Enhanced technical prompt:`,
      
      analysis: `You are an analytical AI. Structure the following request for systematic analysis including:
1. Scope and boundaries
2. Data requirements
3. Analytical framework
4. Evidence criteria
5. Expected deliverables

Original prompt: ${prompt}

Enhanced analytical prompt:`,
      
      creative: `You are a creative AI assistant. Enhance the following creative request to maximize originality and impact:
1. Expand the creative vision
2. Add sensory details and atmosphere
3. Suggest unconventional approaches
4. Include emotional resonance
5. Push boundaries while maintaining coherence

Original prompt: ${prompt}

Enhanced creative prompt:`
    };
    
    const systemPrompt = options.system || "You are a helpful AI assistant specialized in prompt enhancement.";
    const enhancementPrompt = enhancementPrompts[mode] || enhancementPrompts.balanced;
    
    // Auto-detect best model for mode if not specified
    const model = options.model || await this.getBestModelForMode(mode);
    
    return await this.complete(enhancementPrompt, {
      ...options,
      model: model,
      system: systemPrompt,
      temperature: mode === 'creative' ? 0.9 : 0.7,
      max_tokens: options.max_tokens || 2048
    });
  }

  /**
   * Format bytes to human readable size
   */
  formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Stream handler for real-time output
   */
  async *streamCompletion(prompt, options = {}) {
    const stream = await this.complete(prompt, { ...options, stream: true });
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              yield data.response;
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(modelName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get model info: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get model info: ${this.formatError(error)}`);
    }
  }
}

module.exports = OllamaProvider;
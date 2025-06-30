const fetch = require('node-fetch');
const { LRUCache } = require('lru-cache');  // Fixed import for v10
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class AIEnhancer {
  constructor(hfToken) {
    // Security: Validate token format
    if (!hfToken || typeof hfToken !== 'string') {
      throw new Error('Invalid or missing Hugging Face token');
    }
    
    if (!hfToken.startsWith('hf_') || hfToken.length < 20) {
      throw new Error('Invalid Hugging Face token format. Token must start with "hf_" and be at least 20 characters long');
    }
    
    this.token = hfToken;
    
    // Initialize persistent cache
    this.initializeCache();
    
    // Model configurations optimized for prompt enhancement
    // Note: Limited models available on free HF Inference API
    this.models = {
      fast: {
        id: "mistralai/Mixtral-8x7B-Instruct-v0.1",  // Using same model with faster settings
        maxTokens: 512,
        temperature: 0.7
      },
      balanced: {
        id: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        maxTokens: 1024,
        temperature: 0.8
      },
      deep: {
        id: "HuggingFaceH4/zephyr-7b-beta",  // Alternative model with deeper reasoning
        maxTokens: 1500,
        temperature: 0.9
      }
    };
    
    // Usage tracking
    this.usageFile = path.join(process.env.HOME || process.env.USERPROFILE, '.claude-enhancer-stats.json');
    this.usage = { daily: 0, hourly: 0, totalRequests: 0, lastReset: new Date().toISOString() };
    this.loadUsageSync();
    
    // Load persistent cache on startup
    this.loadPersistentCache().then(() => {
      // Clean up expired entries after loading
      this.cleanupExpiredCache();
    });
    
    // Set up graceful shutdown to save cache
    this.setupGracefulShutdown();
  }
  
  initializeCache() {
    // Set up cache directory
    this.cacheDir = process.env.CACHE_DIR || path.join(os.homedir(), '.cache', 'claude-enhancer');
    this.cacheFile = path.join(this.cacheDir, 'cache-data.json');
    this.cacheMetaFile = path.join(this.cacheDir, 'cache-meta.json');
    
    // Initialize in-memory LRU cache
    this.cache = new LRUCache({ 
      max: 1000,
      ttl: 1000 * 60 * 60 * 24, // 24 hour cache
      // Custom disposal function to save to disk when items are evicted
      dispose: (value, key) => {
        this.saveCacheEntry(key, value);
      }
    });
    
    // Cache statistics
    this.cacheStats = {
      hits: 0,
      misses: 0,
      diskReads: 0,
      diskWrites: 0
    };
  }
  
  async ensureCacheDirectory() {
    try {
      await fs.access(this.cacheDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(this.cacheDir, { recursive: true });
    }
  }
  
  async loadPersistentCache() {
    try {
      await this.ensureCacheDirectory();
      
      // Load cache data if it exists
      try {
        const cacheData = await fs.readFile(this.cacheFile, 'utf8');
        const parsedData = JSON.parse(cacheData);
        
        // Load entries that haven't expired
        const now = Date.now();
        let loadedCount = 0;
        
        for (const [key, entry] of Object.entries(parsedData)) {
          if (entry.expires > now) {
            this.cache.set(key, entry.value);
            loadedCount++;
          }
        }
        
        if (loadedCount > 0) {
          console.log(`Loaded ${loadedCount} cached entries from disk`);
        }
      } catch (error) {
        // Cache file doesn't exist or is corrupted, start fresh
        console.log('Starting with fresh cache');
      }
      
      // Load metadata
      try {
        const metaData = await fs.readFile(this.cacheMetaFile, 'utf8');
        this.cacheStats = { ...this.cacheStats, ...JSON.parse(metaData) };
      } catch (error) {
        // Metadata doesn't exist, use defaults
      }
      
    } catch (error) {
      console.warn('Failed to load persistent cache:', error.message);
    }
  }
  
  async savePersistentCache() {
    try {
      await this.ensureCacheDirectory();
      
      // Prepare cache data for serialization
      const cacheData = {};
      const now = Date.now();
      
      // Save current in-memory cache
      for (const [key, value] of this.cache.entries()) {
        cacheData[key] = {
          value: value,
          expires: now + (1000 * 60 * 60 * 24) // 24 hours from now
        };
      }
      
      // Write cache data
      await fs.writeFile(this.cacheFile, JSON.stringify(cacheData, null, 2));
      
      // Write metadata
      await fs.writeFile(this.cacheMetaFile, JSON.stringify(this.cacheStats, null, 2));
      
      this.cacheStats.diskWrites++;
      
    } catch (error) {
      console.warn('Failed to save cache to disk:', error.message);
    }
  }
  
  async saveCacheEntry(key, value) {
    // Save individual cache entry (called when items are evicted)
    try {
      await this.ensureCacheDirectory();
      
      let existingData = {};
      try {
        const data = await fs.readFile(this.cacheFile, 'utf8');
        existingData = JSON.parse(data);
      } catch (error) {
        // File doesn't exist yet
      }
      
      existingData[key] = {
        value: value,
        expires: Date.now() + (1000 * 60 * 60 * 24) // 24 hours
      };
      
      await fs.writeFile(this.cacheFile, JSON.stringify(existingData, null, 2));
      
    } catch (error) {
      // Silently fail individual cache saves to not disrupt main functionality
    }
  }
  
  async cleanupExpiredCache() {
    try {
      const cacheData = await fs.readFile(this.cacheFile, 'utf8');
      const parsedData = JSON.parse(cacheData);
      const now = Date.now();
      
      const cleanedData = {};
      let removedCount = 0;
      
      for (const [key, entry] of Object.entries(parsedData)) {
        if (entry.expires > now) {
          cleanedData[key] = entry;
        } else {
          removedCount++;
        }
      }
      
      if (removedCount > 0) {
        await fs.writeFile(this.cacheFile, JSON.stringify(cleanedData, null, 2));
        console.log(`Cleaned up ${removedCount} expired cache entries`);
      }
      
    } catch (error) {
      // Cache file doesn't exist or is corrupted, ignore
    }
  }
  
  setupGracefulShutdown() {
    // Save cache on process exit
    const saveOnExit = () => {
      this.savePersistentCache().catch(() => {});
    };
    
    process.on('SIGINT', saveOnExit);
    process.on('SIGTERM', saveOnExit);
    process.on('exit', saveOnExit);
  }
  
  loadUsageSync() {
    try {
      const fsSync = require('fs');
      if (fsSync.existsSync(this.usageFile)) {
        const data = fsSync.readFileSync(this.usageFile, 'utf8');
        const saved = JSON.parse(data);
        
        // Reset counters if needed
        const now = new Date();
        const lastReset = new Date(saved.lastReset);
        
        if (now.getDate() !== lastReset.getDate()) {
          this.usage.daily = 0;
          this.usage.hourly = 0;
        } else {
          this.usage.daily = saved.daily || 0;
          if (now.getHours() !== lastReset.getHours()) {
            this.usage.hourly = 0;
          } else {
            this.usage.hourly = saved.hourly || 0;
          }
        }
        
        this.usage.totalRequests = saved.totalRequests || 0;
        this.usage.lastReset = now.toISOString();
      }
    } catch (e) {
      // File doesn't exist yet or error reading
    }
  }
  
  async saveUsage() {
    await fs.writeFile(this.usageFile, JSON.stringify(this.usage, null, 2));
  }
  
  getModelForMode(mode) {
    switch(mode) {
      case 'ultrathink':
        return 'deep';
      case 'coding':
      case 'analysis':
        return 'balanced';
      default:
        return 'fast';
    }
  }
  
  buildPromptForMode(input, mode) {
    const prompts = {
      balanced: `Transform this basic prompt into a well-structured, detailed prompt that will help an AI assistant provide a comprehensive response.

Original prompt: "${input}"

Create an enhanced version that includes:
- Clear context and background
- Specific requirements and constraints
- Expected output format
- Relevant examples if applicable

Enhanced prompt:`,
      
      ultrathink: `Transform this prompt into a deep, thoughtful prompt that encourages systematic reasoning and metacognitive reflection.

Original prompt: "${input}"

Create an enhanced version that:
- Breaks down the problem into components
- Encourages step-by-step analysis
- Includes reflection points
- Requests confidence assessments
- Considers multiple perspectives

Enhanced prompt:`,
      
      coding: `Transform this programming-related prompt into a detailed technical specification.

Original prompt: "${input}"

Create an enhanced version that includes:
- Clear problem statement
- Technical requirements
- Input/output examples
- Performance considerations
- Testing approach
- Expected code structure

Enhanced prompt:`,
      
      analysis: `Transform this prompt into a comprehensive analytical framework.

Original prompt: "${input}"

Create an enhanced version that includes:
- Scope definition
- Data requirements
- Analysis methodology
- Evidence criteria
- Expected insights format

Enhanced prompt:`,
      
      creative: `Transform this creative prompt into an inspiring, detailed creative brief.

Original prompt: "${input}"

Create an enhanced version that:
- Sets creative boundaries
- Encourages originality
- Includes sensory details
- Defines success criteria
- Suggests exploration directions

Enhanced prompt:`
    };
    
    return prompts[mode] || prompts.balanced;
  }
  
  async callHFAPI(prompt, modelKey, mode) {
    const model = this.models[modelKey];
    const enhancementPrompt = this.buildPromptForMode(prompt, mode);
    
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model.id}`,
        {
          headers: { 
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'claude-prompt-enhancer-cli/2.1.0',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          method: 'POST',
          body: JSON.stringify({
            inputs: enhancementPrompt,
            parameters: {
              max_new_tokens: model.maxTokens,
              temperature: model.temperature,
              top_p: 0.95,
              do_sample: true,
              return_full_text: false
            }
          }),
        }
      );
      
      if (!response.ok) {
        let errorMessage = 'API request failed';
        
        try {
          const error = await response.json();
          
          // Handle specific status codes without exposing internal details
          if (response.status === 429) {
            errorMessage = 'Rate limit reached. Please try again later or use template mode.';
          } else if (response.status === 401) {
            errorMessage = 'Invalid API token. Please check your HF_TOKEN configuration.';
          } else if (response.status === 403) {
            errorMessage = 'Access forbidden. This model may require a Pro subscription.';
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          } else {
            // Only include safe error details
            errorMessage = error.error && typeof error.error === 'string' ? 
              error.error.substring(0, 200) : 'API request failed';
          }
        } catch (parseError) {
          // JSON parsing failed, use generic message
          errorMessage = `API request failed with status ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Update usage stats
      this.usage.daily++;
      this.usage.hourly++;
      this.usage.totalRequests++;
      await this.saveUsage();
      
      // Extract the generated text
      if (Array.isArray(result)) {
        return result[0].generated_text;
      }
      return result.generated_text || result;
      
    } catch (error) {
      console.error('HF API Error:', error.message);
      throw error;
    }
  }
  
  async enhance(prompt, mode, options = {}) {
    // Security: Validate input length to prevent DoS
    const MAX_PROMPT_LENGTH = 50000; // 50KB limit
    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw new Error(`Prompt too long (${prompt.length} chars). Maximum allowed: ${MAX_PROMPT_LENGTH} chars`);
    }
    
    // Security: Validate prompt content
    if (typeof prompt !== 'string') {
      throw new Error('Prompt must be a string');
    }
    
    // Security: Validate mode parameter
    const validModes = ['balanced', 'ultrathink', 'coding', 'analysis', 'creative'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid mode: ${mode}. Valid modes: ${validModes.join(', ')}`);
    }
    
    // Security: Validate options
    if (options.model && !this.models[options.model]) {
      throw new Error(`Invalid model: ${options.model}. Valid models: ${Object.keys(this.models).join(', ')}`);
    }
    
    // Check cache first
    const cacheKey = `${mode}:${prompt.substring(0, 100)}:${options.model || 'default'}`;
    const cached = this.cache.get(cacheKey);
    if (cached && !options.noCache) {
      this.cacheStats.hits++;
      return cached;
    }
    
    this.cacheStats.misses++;
    
    // Get model based on mode or user preference
    const modelKey = options.model || this.getModelForMode(mode);
    
    try {
      // Call API with retry logic
      let enhanced;
      let retries = 3;
      
      while (retries > 0) {
        try {
          enhanced = await this.callHFAPI(prompt, modelKey, mode);
          break;
        } catch (error) {
          retries--;
          if (retries === 0 || error.message.includes('Rate limit')) {
            throw error;
          }
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, (3 - retries) * 1000));
        }
      }
      
      // Clean up the response
      enhanced = enhanced.trim();
      
      // Remove any repeated prompt if model included it
      if (enhanced.includes('Enhanced prompt:')) {
        enhanced = enhanced.split('Enhanced prompt:').pop().trim();
      }
      
      // Cache the result
      this.cache.set(cacheKey, enhanced);
      
      // Save cache to disk after each new entry
      this.savePersistentCache().catch(() => {}); // Don't block on cache save
      
      return enhanced;
      
    } catch (error) {
      throw new Error(`AI Enhancement failed: ${error.message}`);
    }
  }
  
  getStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 ? 
      `${Math.round((this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100)}%` : '0%';
    
    return {
      ...this.usage,
      cacheSize: this.cache.size,
      cacheHitRate: hitRate,
      cacheHits: this.cacheStats.hits,
      cacheMisses: this.cacheStats.misses,
      diskReads: this.cacheStats.diskReads,
      diskWrites: this.cacheStats.diskWrites,
      cacheLocation: this.cacheDir
    };
  }
  
  async clearCache() {
    // Clear in-memory cache
    this.cache.clear();
    
    // Clear persistent cache files
    try {
      await fs.unlink(this.cacheFile);
      await fs.unlink(this.cacheMetaFile);
    } catch (error) {
      // Files might not exist, ignore errors
    }
    
    // Reset statistics
    this.cacheStats = {
      hits: 0,
      misses: 0,
      diskReads: 0,
      diskWrites: 0
    };
    
    return 'Cache cleared successfully (both memory and disk)';
  }
  
  async checkModels() {
    const results = {};
    
    for (const [tier, config] of Object.entries(this.models)) {
      const startTime = Date.now();
      
      try {
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${config.id}`,
          {
            headers: { 
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
              'User-Agent': 'claude-prompt-enhancer-cli/2.1.0',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
            method: 'POST',
            body: JSON.stringify({
              inputs: 'Test',
              parameters: {
                max_new_tokens: 5,
                temperature: 0.1
              }
            }),
            timeout: 10000
          }
        );
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          results[tier] = {
            model: config.id,
            available: true,
            responseTime
          };
        } else {
          const errorText = await response.text();
          results[tier] = {
            model: config.id,
            available: false,
            error: `HTTP ${response.status}`,
            suggestion: this.getModelSuggestion(tier, response.status)
          };
        }
      } catch (error) {
        results[tier] = {
          model: config.id,
          available: false,
          error: error.message,
          suggestion: 'Check your internet connection or HF token'
        };
      }
    }
    
    return results;
  }
  
  getModelSuggestion(tier, status) {
    if (status === 401) {
      return 'Invalid or expired HF token';
    } else if (status === 403) {
      return 'Model requires Pro/Enterprise subscription';
    } else if (status === 404) {
      return 'Model not available on Inference API';
    } else if (status === 429) {
      return 'Rate limit exceeded, try again later';
    }
    return 'Model temporarily unavailable';
  }
}

module.exports = AIEnhancer;
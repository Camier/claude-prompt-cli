const fetch = require('node-fetch');
const BaseProvider = require('./base-provider');
const { LRUCache } = require('lru-cache');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * HuggingFace Provider
 * Supports HuggingFace Inference API with caching
 */
class HuggingFaceProvider extends BaseProvider {
  constructor(config = {}) {
    super('huggingface', config);
    
    this.apiKey = config.apiKey || process.env.HF_TOKEN;
    if (!this.apiKey) {
      throw new Error('HuggingFace API key not found. Set HF_TOKEN environment variable.');
    }
    
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.cacheDir = config.cacheDir || path.join(os.homedir(), '.cache', 'claude-enhancer');
    
    // Model configurations
    this.models = {
      fast: {
        id: 'google/flan-t5-xl',
        maxTokens: 512,
        rateLimit: 5000
      },
      balanced: {
        id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        maxTokens: 1024,
        rateLimit: 2000
      },
      deep: {
        id: 'meta-llama/Llama-2-70b-chat-hf',
        maxTokens: 1500,
        rateLimit: 500
      }
    };
    
    // Initialize cache
    this.cache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 60 * 24 // 24 hours
    });
    
    this.cacheStats = {
      hits: 0,
      misses: 0,
      diskReads: 0,
      diskWrites: 0
    };
    
    // Load persistent cache
    this.loadPersistentCache().catch(() => {});
  }

  /**
   * Initialize provider
   */
  async initialize() {
    // Validate API key format
    if (!this.apiKey.startsWith('hf_') || this.apiKey.length < 20) {
      throw new Error('Invalid HuggingFace API key format');
    }
    
    // Ensure cache directory exists
    await fs.mkdir(this.cacheDir, { recursive: true });
    
    return true;
  }

  /**
   * List available models
   */
  async listModels() {
    return Object.entries(this.models).map(([tier, config]) => ({
      id: config.id,
      name: `${tier} (${config.id})`,
      tier: tier,
      maxTokens: config.maxTokens,
      rateLimit: config.rateLimit
    }));
  }

  /**
   * Complete prompt using HuggingFace API
   */
  async complete(prompt, options = {}) {
    const modelTier = options.modelTier || 'balanced';
    const model = this.models[modelTier];
    
    if (!model) {
      throw new Error(`Unknown model tier: ${modelTier}. Use 'fast', 'balanced', or 'deep'`);
    }
    
    // Check cache first
    const cacheKey = this.getCacheKey(prompt, model.id, options);
    const cached = this.cache.get(cacheKey);
    
    if (cached && !options.noCache) {
      this.cacheStats.hits++;
      return cached;
    }
    
    this.cacheStats.misses++;
    
    // Make API request
    const requestBody = {
      inputs: prompt,
      parameters: {
        max_new_tokens: options.maxTokens || model.maxTokens,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9,
        return_full_text: false
      }
    };
    
    try {
      const response = await fetch(`${this.baseUrl}/${model.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'claude-prompt-enhancer/2.1.0'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `API error: ${response.status}`);
      }
      
      const result = await response.json();
      const generatedText = result[0]?.generated_text || '';
      
      // Cache the result
      this.cache.set(cacheKey, generatedText);
      this.savePersistentCache().catch(() => {});
      
      // Track usage
      const tokens = this.estimateTokens(prompt) + this.estimateTokens(generatedText);
      this.trackUsage(tokens);
      
      return generatedText;
    } catch (error) {
      if (error.message.includes('Rate limit')) {
        throw new Error('Rate limit exceeded. Please wait before retrying.');
      }
      throw new Error(`HuggingFace API error: ${this.formatError(error)}`);
    }
  }

  /**
   * Generate cache key
   */
  getCacheKey(prompt, model, options) {
    const params = {
      prompt: prompt.substring(0, 100),
      model,
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens
    };
    
    return JSON.stringify(params);
  }

  /**
   * Load persistent cache from disk
   */
  async loadPersistentCache() {
    try {
      const cacheFile = path.join(this.cacheDir, 'cache-data.json');
      const data = await fs.readFile(cacheFile, 'utf8');
      const cacheData = JSON.parse(data);
      
      // Load entries that haven't expired
      const now = Date.now();
      let loaded = 0;
      
      for (const [key, entry] of Object.entries(cacheData)) {
        if (entry.expires > now) {
          this.cache.set(key, entry.value);
          loaded++;
        }
      }
      
      this.cacheStats.diskReads++;
      console.log(`Loaded ${loaded} cached entries from disk`);
    } catch (error) {
      // Cache file doesn't exist or is corrupted
    }
  }

  /**
   * Save cache to disk
   */
  async savePersistentCache() {
    try {
      const cacheFile = path.join(this.cacheDir, 'cache-data.json');
      const cacheData = {};
      
      // Export cache entries with expiration times
      for (const [key, value] of this.cache.entries()) {
        cacheData[key] = {
          value,
          expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
      }
      
      await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
      this.cacheStats.diskWrites++;
    } catch (error) {
      console.warn('Failed to save cache:', error.message);
    }
  }

  /**
   * Get enhanced usage statistics
   */
  getUsageStats() {
    const stats = super.getUsageStats();
    
    return {
      ...stats,
      cache: {
        size: this.cache.size,
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        hitRate: this.cacheStats.hits > 0 
          ? `${((this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100).toFixed(1)}%`
          : '0%',
        diskReads: this.cacheStats.diskReads,
        diskWrites: this.cacheStats.diskWrites
      },
      cacheLocation: this.cacheDir
    };
  }

  /**
   * Clear cache
   */
  async clearCache() {
    this.cache.clear();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      diskReads: 0,
      diskWrites: 0
    };
    
    try {
      const cacheFile = path.join(this.cacheDir, 'cache-data.json');
      await fs.unlink(cacheFile);
    } catch (error) {
      // File might not exist
    }
    
    return 'Cache cleared successfully';
  }

  /**
   * Check model availability
   */
  async checkModels() {
    const results = {};
    
    for (const [tier, config] of Object.entries(this.models)) {
      try {
        const startTime = Date.now();
        await this.complete('Test', { modelTier: tier, maxTokens: 10 });
        const responseTime = Date.now() - startTime;
        
        results[tier] = {
          available: true,
          model: config.id,
          responseTime: responseTime
        };
      } catch (error) {
        results[tier] = {
          available: false,
          model: config.id,
          error: error.message,
          suggestion: error.message.includes('401') 
            ? 'Check your HF_TOKEN' 
            : 'Model may require Pro subscription'
        };
      }
    }
    
    return results;
  }
}

module.exports = HuggingFaceProvider;
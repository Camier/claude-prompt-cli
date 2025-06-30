const OllamaProvider = require('./ollama');
const HuggingFaceProvider = require('./huggingface');

/**
 * Provider Registry
 * Manages multiple LLM providers and handles failover
 */
class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = null;
    this.initializeProviders();
  }

  /**
   * Initialize available providers
   */
  async initializeProviders() {
    // Register available providers
    this.registerProvider('ollama', OllamaProvider);
    this.registerProvider('huggingface', HuggingFaceProvider);
    
    // Add more providers as they're implemented
    // this.registerProvider('openai', OpenAIProvider);
    // this.registerProvider('anthropic', AnthropicProvider);
    // this.registerProvider('google', GoogleProvider);
  }

  /**
   * Register a provider
   */
  registerProvider(name, ProviderClass, config = {}) {
    try {
      const provider = new ProviderClass(config);
      this.providers.set(name, provider);
      
      // Set first provider as default
      if (!this.defaultProvider) {
        this.defaultProvider = name;
      }
    } catch (error) {
      console.warn(`Failed to register provider ${name}: ${error.message}`);
    }
  }

  /**
   * Get a provider by name
   */
  getProvider(name) {
    if (!name && this.defaultProvider) {
      return this.providers.get(this.defaultProvider);
    }
    
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider '${name}' not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
    }
    
    return provider;
  }

  /**
   * List all available providers
   */
  listProviders() {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      type: provider.constructor.name,
      available: true,
      default: name === this.defaultProvider
    }));
  }

  /**
   * Set default provider
   */
  setDefaultProvider(name) {
    if (!this.providers.has(name)) {
      throw new Error(`Provider '${name}' not found`);
    }
    this.defaultProvider = name;
  }

  /**
   * Execute with fallback
   * Try primary provider, fall back to others on failure
   */
  async executeWithFallback(operation, options = {}) {
    const errors = [];
    const preferredProvider = options.provider || this.defaultProvider;
    
    // Try preferred provider first
    if (preferredProvider) {
      try {
        const provider = this.getProvider(preferredProvider);
        return await operation(provider);
      } catch (error) {
        errors.push({ provider: preferredProvider, error: error.message });
      }
    }
    
    // Try other providers
    for (const [name, provider] of this.providers) {
      if (name === preferredProvider) continue;
      
      try {
        console.log(`Falling back to ${name} provider...`);
        return await operation(provider);
      } catch (error) {
        errors.push({ provider: name, error: error.message });
      }
    }
    
    // All providers failed
    throw new Error(`All providers failed:\n${errors.map(e => `- ${e.provider}: ${e.error}`).join('\n')}`);
  }

  /**
   * Check provider health
   */
  async checkHealth() {
    const health = {};
    
    for (const [name, provider] of this.providers) {
      try {
        await provider.initialize();
        const models = await provider.listModels();
        health[name] = {
          status: 'healthy',
          models: models.length,
          default: name === this.defaultProvider
        };
      } catch (error) {
        health[name] = {
          status: 'unhealthy',
          error: error.message,
          default: name === this.defaultProvider
        };
      }
    }
    
    return health;
  }

  /**
   * Get combined usage stats from all providers
   */
  getUsageStats() {
    const stats = {};
    
    for (const [name, provider] of this.providers) {
      stats[name] = provider.getUsageStats();
    }
    
    return stats;
  }

  /**
   * Compare outputs across providers
   */
  async compareProviders(prompt, options = {}) {
    const results = {};
    
    for (const [name, provider] of this.providers) {
      try {
        console.log(`Testing ${name}...`);
        const startTime = Date.now();
        const result = await provider.complete(prompt, options);
        const endTime = Date.now();
        
        results[name] = {
          success: true,
          response: result,
          time: endTime - startTime,
          tokens: provider.estimateTokens(result)
        };
      } catch (error) {
        results[name] = {
          success: false,
          error: error.message
        };
      }
    }
    
    return results;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getRegistry: () => {
    if (!instance) {
      instance = new ProviderRegistry();
    }
    return instance;
  },
  ProviderRegistry
};
/**
 * Base Provider Class
 * Abstract base class for all LLM providers
 */
class BaseProvider {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.models = {};
    this.rateLimits = {
      requestsPerHour: 1000,
      requestsPerMinute: 60,
      tokensPerMinute: 10000
    };
    this.usage = {
      requests: 0,
      tokens: 0,
      lastReset: new Date()
    };
  }

  /**
   * Initialize the provider
   */
  async initialize() {
    throw new Error('Provider must implement initialize()');
  }

  /**
   * List available models
   */
  async listModels() {
    throw new Error('Provider must implement listModels()');
  }

  /**
   * Check if a model is available
   */
  async isModelAvailable(modelId) {
    const models = await this.listModels();
    return models.some(m => m.id === modelId);
  }

  /**
   * Generate a completion
   * @param {string} prompt - The prompt to complete
   * @param {Object} options - Generation options
   * @returns {Promise<string>} - The generated text
   */
  async complete(prompt, options = {}) {
    throw new Error('Provider must implement complete()');
  }

  /**
   * Generate enhanced prompt
   * @param {string} prompt - Original prompt
   * @param {string} mode - Enhancement mode
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Enhanced prompt
   */
  async enhance(prompt, mode, options = {}) {
    // Default implementation using complete()
    const systemPrompt = this.getSystemPromptForMode(mode);
    const fullPrompt = `${systemPrompt}\n\nUser prompt: ${prompt}\n\nEnhanced prompt:`;
    return await this.complete(fullPrompt, options);
  }

  /**
   * Get system prompt for enhancement mode
   */
  getSystemPromptForMode(mode) {
    const prompts = {
      balanced: 'Enhance this prompt to be clear, structured, and comprehensive.',
      ultrathink: 'Transform this into a deep reasoning prompt with metacognitive elements.',
      coding: 'Optimize this prompt for programming tasks with clear specifications.',
      analysis: 'Structure this prompt for systematic analysis with evidence-based reasoning.',
      creative: 'Enhance this prompt for maximum creativity and originality.'
    };
    return prompts[mode] || prompts.balanced;
  }

  /**
   * Check rate limits
   */
  checkRateLimits() {
    const now = new Date();
    const timeSinceReset = now - this.usage.lastReset;
    
    // Reset hourly counters
    if (timeSinceReset > 3600000) {
      this.usage.requests = 0;
      this.usage.tokens = 0;
      this.usage.lastReset = now;
    }
    
    if (this.usage.requests >= this.rateLimits.requestsPerHour) {
      throw new Error(`Rate limit exceeded: ${this.rateLimits.requestsPerHour} requests per hour`);
    }
  }

  /**
   * Track usage
   */
  trackUsage(tokens) {
    this.usage.requests++;
    this.usage.tokens += tokens;
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      provider: this.name,
      requests: this.usage.requests,
      tokens: this.usage.tokens,
      rateLimits: this.rateLimits,
      lastReset: this.usage.lastReset
    };
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(text) {
    // Rough estimate: 1 token per 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Format error messages safely
   */
  formatError(error) {
    const safeErrors = {
      'ECONNREFUSED': 'Connection refused. Is the service running?',
      'ETIMEDOUT': 'Request timed out. Please try again.',
      'rate_limit': 'Rate limit exceeded. Please wait before retrying.',
      '401': 'Authentication failed. Please check your API key.',
      '404': 'Model not found. Please check the model name.',
      '500': 'Server error. Please try again later.'
    };
    
    return safeErrors[error.code] || safeErrors[error.status] || 'An error occurred';
  }
}

module.exports = BaseProvider;
/**
 * Template Utilities
 * Centralized template management for the CLI
 */

const { enhancementModes, advancedFrameworks, enhancedModes } = require('./templates');
const chalk = require('chalk');

// Mode aliases for backwards compatibility and better naming
const modeAliases = {
  // New preferred names → actual implementation
  'standard': 'balanced',  // Standard mode uses simple balanced template
  'adaptive': 'adaptiveThink',
  'smart-code': 'smartCode', 
  'deep-analysis': 'insightAnalysis',
  'creative-boost': 'creativeBoost',
  'research': 'researchOptimized'
};

// Deprecated mode warnings
const deprecatedModes = {
  'balanced': 'standard',  // Only the simple template version is deprecated
  'adaptiveThink': 'adaptive',
  'smartCode': 'smart-code',
  'insightAnalysis': 'deep-analysis', 
  'creativeBoost': 'creative-boost',
  'researchOptimized': 'research'
};

/**
 * Get all available templates merged into a single object
 * @returns {Object} All templates keyed by mode name
 */
function getAllTemplates() {
  // Be careful about order - enhanced modes override standard ones with same name
  const baseTemplates = { ...enhancementModes, ...advancedFrameworks, ...enhancedModes };
  
  // Add specific aliases with explicit control
  const aliases = {
    'standard': enhancementModes.balanced,  // Standard uses simple balanced template
    'adaptive': enhancedModes.adaptiveThink,
    'smart-code': enhancedModes.smartCode, 
    'deep-analysis': enhancedModes.insightAnalysis,
    'creative-boost': enhancedModes.creativeBoost,
    'research': enhancedModes.researchOptimized
  };
  
  return { ...baseTemplates, ...aliases };
}

/**
 * Get a specific template by mode name
 * @param {string} mode - The mode name (case-sensitive)
 * @returns {Object} The template object with enhance function
 */
function getTemplate(mode) {
  // Show deprecation warning if using old mode name
  if (deprecatedModes[mode]) {
    console.warn(chalk.yellow(`⚠️  Mode "${mode}" is deprecated. Use "${deprecatedModes[mode]}" instead.`));
  }
  
  const templates = getAllTemplates();
  return templates[mode] || templates['standard'] || enhancementModes.balanced;
}

/**
 * Get template and enhance in one call
 * @param {string} input - The input text to enhance
 * @param {string} mode - The mode name
 * @param {Object} context - Optional context for ML-enhanced modes
 * @returns {string} Enhanced prompt
 */
function enhanceWithTemplate(input, mode, context = {}) {
  const template = getTemplate(mode);
  
  // Check if template has context-aware enhance method (ML-enhanced modes)
  if (template.enhance.length > 1) {
    return template.enhance(input, context);
  }
  
  return template.enhance(input);
}

/**
 * List all available modes grouped by type with new preferred structure
 * @returns {Object} Modes grouped by type
 */
function getGroupedModes() {
  return {
    standard: [
      { key: 'standard', name: 'Standard', description: 'Clear, structured prompts (recommended for most tasks)' },
      { key: 'coding', name: 'Coding', description: 'Optimized for programming and technical tasks' },
      { key: 'analysis', name: 'Analysis', description: 'Systematic analysis with evidence and reasoning' },
      { key: 'creative', name: 'Creative', description: 'Enhanced creative tasks and brainstorming' },
      { key: 'ultrathink', name: 'Deep Think', description: 'Complex reasoning with metacognitive reflection' }
    ],
    advanced: [
      { key: 'adaptive', name: 'Adaptive', description: 'Self-adjusting reasoning depth based on complexity' },
      { key: 'smart-code', name: 'Smart Code', description: 'Intelligent code generation with pattern recognition' },
      { key: 'deep-analysis', name: 'Deep Analysis', description: 'Advanced insights with pattern discovery' },
      { key: 'creative-boost', name: 'Creative+', description: 'Enhanced creativity with structured innovation' },
      { key: 'research', name: 'Research', description: 'Academic-grade research with citation awareness' }
    ],
    frameworks: Object.entries(advancedFrameworks).map(([key, framework]) => ({
      key,
      name: framework.name,
      description: framework.description
    }))
  };
}

/**
 * Check if a mode exists
 * @param {string} mode - The mode name to check
 * @returns {boolean} True if mode exists
 */
function modeExists(mode) {
  const templates = getAllTemplates();
  return mode in templates;
}

module.exports = {
  getAllTemplates,
  getTemplate,
  enhanceWithTemplate,
  getGroupedModes,
  modeExists
};
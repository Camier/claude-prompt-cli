/**
 * Template Utilities
 * Centralized template management for the CLI
 */

const { enhancementModes, advancedFrameworks, enhancedModes } = require('./templates');

/**
 * Get all available templates merged into a single object
 * @returns {Object} All templates keyed by mode name
 */
function getAllTemplates() {
  return { ...enhancementModes, ...advancedFrameworks, ...enhancedModes };
}

/**
 * Get a specific template by mode name
 * @param {string} mode - The mode name (case-sensitive)
 * @returns {Object} The template object with enhance function
 */
function getTemplate(mode) {
  const templates = getAllTemplates();
  return templates[mode] || enhancementModes.balanced;
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
 * List all available modes grouped by type
 * @returns {Object} Modes grouped by type
 */
function getGroupedModes() {
  return {
    standard: Object.entries(enhancementModes).map(([key, mode]) => ({
      key,
      name: mode.name,
      description: mode.description
    })),
    enhanced: Object.entries(enhancedModes).map(([key, mode]) => ({
      key,
      name: mode.name,
      description: mode.description
    })),
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
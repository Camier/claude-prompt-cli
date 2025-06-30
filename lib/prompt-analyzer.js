/**
 * Prompt Analyzer - Smart Mode Detection
 * Analyzes prompts to suggest appropriate modes and settings
 */

/**
 * Analyze prompt content and suggest optimal mode
 * @param {string} prompt - The input prompt to analyze
 * @returns {Object} Analysis with suggestions
 */
function analyzePrompt(prompt) {
  const analysis = {
    detectedType: 'general',
    suggestedMode: 'standard',
    suggestedProvider: 'auto',
    confidence: 0,
    reasoning: [],
    keywords: []
  };

  const text = prompt.toLowerCase();
  const words = text.split(/\s+/);
  
  // Programming/Coding patterns
  const codingKeywords = [
    'function', 'class', 'method', 'variable', 'api', 'endpoint', 'code', 'programming',
    'debug', 'test', 'algorithm', 'syntax', 'compile', 'script', 'library', 'framework',
    'database', 'sql', 'javascript', 'python', 'java', 'react', 'node', 'git'
  ];
  
  const codingScore = countKeywords(words, codingKeywords);
  if (codingScore > 0) {
    analysis.detectedType = 'coding';
    analysis.suggestedMode = 'coding';
    analysis.suggestedProvider = 'ollama'; // Faster for iterative coding
    analysis.confidence = Math.min(90, 40 + codingScore * 10);
    analysis.reasoning.push(`Detected ${codingScore} programming-related terms`);
    analysis.keywords.push(...codingKeywords.filter(k => text.includes(k)));
  }

  // Analysis/Research patterns
  const analysisKeywords = [
    'analyze', 'analysis', 'compare', 'comparison', 'evaluate', 'assessment',
    'research', 'study', 'investigate', 'examine', 'review', 'critique',
    'trends', 'data', 'statistics', 'evidence', 'findings', 'conclusion'
  ];
  
  const analysisScore = countKeywords(words, analysisKeywords);
  if (analysisScore > codingScore) {
    analysis.detectedType = 'analysis';
    analysis.suggestedMode = 'analysis';
    analysis.suggestedProvider = 'huggingface'; // Better for complex reasoning
    analysis.confidence = Math.min(85, 35 + analysisScore * 12);
    analysis.reasoning.push(`Detected ${analysisScore} analysis-related terms`);
    analysis.keywords.push(...analysisKeywords.filter(k => text.includes(k)));
  }

  // Creative patterns
  const creativeKeywords = [
    'creative', 'creativity', 'story', 'narrative', 'character', 'plot',
    'brainstorm', 'imagine', 'invent', 'design', 'artistic', 'original',
    'novel', 'poem', 'script', 'dialogue', 'theme', 'metaphor'
  ];
  
  const creativeScore = countKeywords(words, creativeKeywords);
  if (creativeScore > Math.max(codingScore, analysisScore)) {
    analysis.detectedType = 'creative';
    analysis.suggestedMode = 'creative';
    analysis.suggestedProvider = 'auto';
    analysis.confidence = Math.min(80, 30 + creativeScore * 15);
    analysis.reasoning.push(`Detected ${creativeScore} creative writing terms`);
    analysis.keywords.push(...creativeKeywords.filter(k => text.includes(k)));
  }

  // Complex reasoning patterns
  const complexKeywords = [
    'philosophy', 'philosophical', 'ethics', 'moral', 'complex', 'intricate',
    'paradox', 'dilemma', 'theoretical', 'abstract', 'conceptual',
    'why', 'how', 'what if', 'consider', 'implications', 'consequences'
  ];
  
  const complexScore = countKeywords(words, complexKeywords);
  const hasComplexStructure = text.includes('what if') || text.includes('consider') || 
                              text.split('?').length > 2 || prompt.length > 200;
  
  if (complexScore > 1 || hasComplexStructure) {
    if (analysis.confidence < 60) {
      analysis.detectedType = 'complex';
      analysis.suggestedMode = 'ultrathink';
      analysis.suggestedProvider = 'huggingface';
      analysis.confidence = Math.min(75, 40 + complexScore * 8);
      analysis.reasoning.push('Detected complex reasoning requirements');
    } else {
      // Upgrade existing suggestion to advanced mode
      const advancedMode = getAdvancedMode(analysis.suggestedMode);
      if (advancedMode) {
        analysis.suggestedMode = advancedMode;
        analysis.reasoning.push('Upgraded to advanced mode due to complexity');
      }
    }
  }

  // Length-based adjustments
  if (prompt.length > 500) {
    analysis.reasoning.push('Long prompt detected - may benefit from structured approach');
    if (analysis.confidence < 50) {
      analysis.suggestedMode = 'analysis';
      analysis.confidence = 50;
    }
  }

  // Default fallback
  if (analysis.confidence < 30) {
    analysis.detectedType = 'general';
    analysis.suggestedMode = 'standard';
    analysis.suggestedProvider = 'auto';
    analysis.confidence = 30;
    analysis.reasoning.push('No specific patterns detected - using standard mode');
  }

  return analysis;
}

/**
 * Count how many keywords appear in the text
 */
function countKeywords(words, keywords) {
  return keywords.reduce((count, keyword) => {
    return count + (words.includes(keyword) ? 1 : 0);
  }, 0);
}

/**
 * Get advanced version of a mode
 */
function getAdvancedMode(mode) {
  const upgrades = {
    'standard': 'adaptive',
    'coding': 'smart-code',
    'analysis': 'deep-analysis',
    'creative': 'creative-boost'
  };
  return upgrades[mode];
}

/**
 * Format analysis as user-friendly suggestion
 */
function formatSuggestion(analysis) {
  const { suggestedMode, suggestedProvider, confidence, reasoning } = analysis;
  
  let suggestion = `🤖 Smart suggestion: --mode ${suggestedMode}`;
  
  if (suggestedProvider !== 'auto') {
    suggestion += ` --provider ${suggestedProvider}`;
  }
  
  suggestion += ` (${confidence}% confidence)`;
  
  if (reasoning.length > 0) {
    suggestion += `\n💡 ${reasoning[0]}`;
  }
  
  return suggestion;
}

module.exports = {
  analyzePrompt,
  formatSuggestion
};
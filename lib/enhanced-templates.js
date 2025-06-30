/**
 * Enhanced Templates with ML Optimization
 * Next-generation prompt templates with adaptive enhancement
 */

const enhancedModes = {
  // Existing modes with ML enhancements
  balanced: {
    name: 'Balanced+',
    description: 'ML-optimized balanced prompts with context awareness',
    enhance: (input, context = {}) => {
      const complexity = analyzeComplexity(input);
      const domain = detectDomain(input);
      
      return `[Context-Aware Query]
${input}

Domain: ${domain}
Complexity: ${complexity}

Requirements:
- Provide a comprehensive response tailored to the ${domain} domain
- Adjust detail level based on ${complexity} complexity
- Structure your answer with clear sections and transitions
- Include relevant examples from the ${domain} field
- Validate reasoning with domain-specific knowledge

${getContextualHints(domain, complexity)}

Expected Output:
A well-structured, domain-aware response that matches the complexity level of the query with appropriate depth and technical accuracy.`;
    }
  },

  adaptiveThink: {
    name: 'Adaptive Think',
    description: 'Self-adjusting reasoning depth based on problem complexity',
    enhance: (input, context = {}) => {
      const reasoningDepth = calculateReasoningDepth(input);
      const steps = generateReasoningSteps(input, reasoningDepth);
      
      return `[Adaptive Reasoning Protocol - Depth ${reasoningDepth}]

Challenge:
${input}

Dynamic Reasoning Framework:
${steps.map((step, idx) => `${idx + 1}. ${step.title}:
   ${step.subtasks.map(st => `- ${st}`).join('\n   ')}`).join('\n\n')}

Metacognitive Checkpoints:
- Assumption validation after each major step
- Confidence calibration (0-100%) for conclusions
- Alternative pathway identification
- Error detection and correction loops

Quality Metrics:
- Logical consistency score
- Evidence strength rating
- Completeness assessment
- Uncertainty quantification

Please engage ${reasoningDepth}-level reasoning with adaptive depth adjustment as needed.`;
    }
  },

  smartCode: {
    name: 'Smart Code',
    description: 'Intelligent code generation with pattern recognition',
    enhance: (input, context = {}) => {
      const language = detectProgrammingLanguage(input);
      const patterns = identifyCodePatterns(input);
      const complexity = estimateCodeComplexity(input);
      
      return `[Intelligent Code Generation Task]

Request:
${input}

Detected Context:
- Language: ${language || 'Auto-detect'}
- Patterns: ${patterns.join(', ')}
- Complexity: ${complexity}

Smart Implementation Guidelines:
1. Pattern-Aware Solution:
   ${patterns.map(p => `- Apply ${p} pattern where appropriate`).join('\n   ')}

2. Language-Optimized Code:
   - Use ${language || 'best-fit language'} idioms and conventions
   - Leverage language-specific features for elegance
   - Follow ${language || 'industry'} style guidelines

3. Complexity Management:
   ${complexity === 'high' ? 
     '- Break into modular components\n   - Create abstraction layers\n   - Implement progressive enhancement' :
     '- Keep solution simple and direct\n   - Optimize for readability\n   - Avoid over-engineering'}

4. Intelligent Testing:
   - Generate test cases based on code structure
   - Include edge cases specific to ${patterns.join(' and ')}
   - Provide performance benchmarks

5. Auto-Documentation:
   - Self-documenting code structure
   - Inline explanations for complex logic
   - API documentation if applicable

Please generate an intelligent, pattern-aware solution optimized for ${language || 'the detected language'}.`;
    }
  },

  insightAnalysis: {
    name: 'Insight Analysis',
    description: 'Deep insights with pattern discovery and trend identification',
    enhance: (input, context = {}) => {
      const analysisType = determineAnalysisType(input);
      const dataPoints = extractDataPoints(input);
      
      return `[Advanced Insight Analysis]

Subject:
${input}

Analysis Configuration:
- Type: ${analysisType}
- Data Points: ${dataPoints.length > 0 ? dataPoints.join(', ') : 'To be identified'}
- Depth: Comprehensive with pattern discovery

Multi-Dimensional Analysis Framework:

1. Surface-Level Insights:
   - Immediate observations and facts
   - Direct relationships and correlations
   - Obvious patterns and trends

2. Deep Pattern Recognition:
   - Hidden correlations across dimensions
   - Temporal patterns and cycles
   - Anomaly detection and significance

3. Predictive Insights:
   - Trend extrapolation and forecasting
   - Risk assessment and probability analysis
   - Scenario modeling and outcomes

4. Strategic Implications:
   - Actionable recommendations
   - Decision-making frameworks
   - Opportunity identification

5. Meta-Analysis:
   - Confidence levels for each insight
   - Data quality assessment
   - Limitation acknowledgment

Deliver insights that reveal both obvious and hidden patterns, with actionable intelligence.`;
    }
  },

  creativeBoost: {
    name: 'Creative Boost',
    description: 'Enhanced creativity with structured innovation techniques',
    enhance: (input, context = {}) => {
      const creativeAngle = selectCreativeApproach(input);
      const constraints = identifyConstraints(input);
      
      return `[Creative Innovation Protocol]

Creative Challenge:
${input}

Innovation Framework:
- Approach: ${creativeAngle}
- Constraints: ${constraints.length > 0 ? constraints.join(', ') : 'Open-ended'}

Creative Expansion Techniques:

1. Divergent Exploration:
   - Generate 10+ initial concepts
   - Apply SCAMPER method (Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse)
   - Cross-domain inspiration mining
   - Random stimulus integration

2. Creative Combinations:
   - Merge unexpected elements
   - Apply biomimicry principles
   - Use metaphorical thinking
   - Explore paradoxical solutions

3. Innovation Amplifiers:
   - "What if" scenario expansion
   - Constraint removal exercise
   - Future-casting (10, 50, 100 years)
   - Reverse problem solving

4. Originality Metrics:
   - Novelty score (1-10)
   - Feasibility assessment
   - Impact potential
   - Differentiation factor

5. Refinement Process:
   - Select top 3 concepts
   - Deep dive development
   - Practical implementation path
   - Unique value proposition

Generate breakthrough ideas that balance creativity with ${constraints.length > 0 ? 'the given constraints' : 'practical application'}.`;
    }
  },

  researchOptimized: {
    name: 'Research Optimized',
    description: 'Academic-grade research with citation awareness',
    enhance: (input, context = {}) => {
      const field = identifyResearchField(input);
      const methodologies = suggestMethodologies(input, field);
      
      return `[Academic Research Query]

Research Question:
${input}

Field: ${field}
Suggested Methodologies: ${methodologies.join(', ')}

Scholarly Research Framework:

1. Literature Review Approach:
   - Identify seminal works in ${field}
   - Recent developments (last 5 years)
   - Contrasting perspectives and debates
   - Research gaps and opportunities

2. Theoretical Framework:
   - Relevant theories and models
   - Conceptual foundations
   - Operational definitions
   - Hypothesis formulation (if applicable)

3. Methodological Rigor:
   - Appropriate research design
   - Data collection strategies
   - Analysis techniques
   - Validity and reliability considerations

4. Critical Analysis:
   - Strengths and limitations of existing research
   - Methodological critiques
   - Alternative interpretations
   - Future research directions

5. Academic Standards:
   - Citation best practices
   - Objective, balanced perspective
   - Acknowledgment of limitations
   - Ethical considerations

Please provide a research-grade response suitable for academic discourse in ${field}.`;
    }
  }
};

// Helper functions for ML-powered enhancements
function analyzeComplexity(input) {
  const wordCount = input.split(' ').length;
  const technicalTerms = input.match(/\b[A-Z][a-z]+[A-Z]\w*\b/g) || [];
  const questionMarks = (input.match(/\?/g) || []).length;
  
  if (wordCount > 100 || technicalTerms.length > 5 || questionMarks > 3) return 'high';
  if (wordCount > 50 || technicalTerms.length > 2 || questionMarks > 1) return 'medium';
  return 'low';
}

function detectDomain(input) {
  const domains = {
    technology: /\b(code|programming|software|api|database|algorithm|system|tech)\b/i,
    science: /\b(research|hypothesis|experiment|data|analysis|theory|study)\b/i,
    business: /\b(market|strategy|revenue|customer|growth|roi|business)\b/i,
    creative: /\b(design|creative|art|story|narrative|aesthetic|style)\b/i,
    academic: /\b(thesis|paper|citation|literature|review|academic|scholarly)\b/i
  };
  
  for (const [domain, pattern] of Object.entries(domains)) {
    if (pattern.test(input)) return domain;
  }
  return 'general';
}

function getContextualHints(domain, complexity) {
  const hints = {
    technology: {
      high: 'Consider system architecture, scalability, and edge cases',
      medium: 'Focus on implementation details and best practices',
      low: 'Provide clear examples and basic explanations'
    },
    science: {
      high: 'Include methodology, statistical analysis, and peer-reviewed sources',
      medium: 'Explain concepts with supporting evidence and examples',
      low: 'Use analogies and simplified explanations'
    },
    business: {
      high: 'Provide strategic analysis, ROI calculations, and market insights',
      medium: 'Include case studies and practical frameworks',
      low: 'Focus on core concepts and actionable advice'
    }
  };
  
  return `Contextual Guidance: ${hints[domain]?.[complexity] || 'Adapt response to audience expertise level'}`;
}

function calculateReasoningDepth(input) {
  const factors = {
    length: input.length > 200 ? 3 : input.length > 100 ? 2 : 1,
    complexity: (input.match(/\b(why|how|analyze|explain|compare)\b/gi) || []).length,
    nested: (input.match(/\band\b|\bor\b|\bif\b/gi) || []).length > 3 ? 2 : 1
  };
  
  const score = factors.length + factors.complexity + factors.nested;
  return score > 6 ? 'deep' : score > 3 ? 'moderate' : 'surface';
}

function generateReasoningSteps(input, depth) {
  const baseSteps = [
    {
      title: 'Problem Decomposition',
      subtasks: ['Identify core components', 'Define relationships', 'Establish constraints']
    },
    {
      title: 'Systematic Analysis',
      subtasks: ['Examine each component', 'Trace logical connections', 'Identify dependencies']
    }
  ];
  
  if (depth === 'moderate' || depth === 'deep') {
    baseSteps.push({
      title: 'Cross-Validation',
      subtasks: ['Check internal consistency', 'Verify against known facts', 'Test edge cases']
    });
  }
  
  if (depth === 'deep') {
    baseSteps.push(
      {
        title: 'Alternative Perspectives',
        subtasks: ['Consider opposing viewpoints', 'Explore unconventional approaches', 'Challenge assumptions']
      },
      {
        title: 'Synthesis and Integration',
        subtasks: ['Combine insights holistically', 'Resolve contradictions', 'Formulate unified understanding']
      }
    );
  }
  
  return baseSteps;
}

function detectProgrammingLanguage(input) {
  const languages = {
    'javascript': /\b(javascript|js|node|react|vue|angular)\b/i,
    'python': /\b(python|django|flask|pandas|numpy)\b/i,
    'java': /\b(java|spring|android|jvm)\b/i,
    'typescript': /\b(typescript|ts|angular|type)\b/i,
    'go': /\b(golang|go lang|go\s+language)\b/i,
    'rust': /\b(rust|cargo|crate)\b/i,
    'c++': /\b(c\+\+|cpp|STL)\b/i,
    'sql': /\b(sql|query|database|select|join)\b/i
  };
  
  for (const [lang, pattern] of Object.entries(languages)) {
    if (pattern.test(input)) return lang;
  }
  return null;
}

function identifyCodePatterns(input) {
  const patterns = [];
  const patternMap = {
    'singleton': /\bsingleton\b/i,
    'factory': /\bfactory\b/i,
    'observer': /\bobserver|event|listener\b/i,
    'MVC': /\b(mvc|model.view.controller)\b/i,
    'REST': /\b(rest|api|endpoint)\b/i,
    'async': /\b(async|promise|await|concurrent)\b/i,
    'OOP': /\b(class|object|inheritance|polymorphism)\b/i,
    'functional': /\b(functional|pure|immutable|map|reduce|filter)\b/i
  };
  
  for (const [pattern, regex] of Object.entries(patternMap)) {
    if (regex.test(input)) patterns.push(pattern);
  }
  
  return patterns.length > 0 ? patterns : ['general'];
}

function estimateCodeComplexity(input) {
  const complexityFactors = {
    multipleFeatures: (input.match(/\band\b/gi) || []).length > 2,
    algorithmicThinking: /\b(algorithm|optimize|performance|complexity)\b/i.test(input),
    systemDesign: /\b(architect|design|scale|distributed)\b/i.test(input),
    dataStructures: /\b(tree|graph|hash|queue|stack)\b/i.test(input)
  };
  
  const score = Object.values(complexityFactors).filter(Boolean).length;
  return score >= 3 ? 'high' : score >= 1 ? 'medium' : 'low';
}

function determineAnalysisType(input) {
  if (/\b(trend|pattern|forecast|predict)\b/i.test(input)) return 'Predictive Analysis';
  if (/\b(compare|contrast|versus|vs)\b/i.test(input)) return 'Comparative Analysis';
  if (/\b(cause|effect|impact|influence)\b/i.test(input)) return 'Causal Analysis';
  if (/\b(describe|explain|what|how)\b/i.test(input)) return 'Descriptive Analysis';
  return 'Exploratory Analysis';
}

function extractDataPoints(input) {
  const dataPoints = [];
  
  // Extract numbers
  const numbers = input.match(/\b\d+(\.\d+)?%?\b/g) || [];
  dataPoints.push(...numbers.map(n => `Metric: ${n}`));
  
  // Extract quoted terms
  const quotes = input.match(/"[^"]+"/g) || [];
  dataPoints.push(...quotes.map(q => `Term: ${q}`));
  
  // Extract comparisons
  const comparisons = input.match(/\b(\w+)\s+(?:vs|versus|compared to)\s+(\w+)\b/gi) || [];
  dataPoints.push(...comparisons.map(c => `Comparison: ${c}`));
  
  return dataPoints;
}

function selectCreativeApproach(input) {
  if (/\b(innovative|breakthrough|revolutionary)\b/i.test(input)) return 'Disruptive Innovation';
  if (/\b(improve|enhance|optimize)\b/i.test(input)) return 'Incremental Innovation';
  if (/\b(combine|merge|hybrid)\b/i.test(input)) return 'Combinatorial Creativity';
  if (/\b(reimagine|reinvent|transform)\b/i.test(input)) return 'Transformational Creativity';
  return 'Open Exploration';
}

function identifyConstraints(input) {
  const constraints = [];
  
  if (/\b(budget|cost|price|affordable)\b/i.test(input)) constraints.push('Budget limitations');
  if (/\b(time|deadline|quick|fast)\b/i.test(input)) constraints.push('Time constraints');
  if (/\b(simple|easy|user.friendly)\b/i.test(input)) constraints.push('Simplicity requirement');
  if (/\b(sustainable|eco|green)\b/i.test(input)) constraints.push('Sustainability focus');
  if (/\b(scale|large|massive)\b/i.test(input)) constraints.push('Scalability needs');
  
  return constraints;
}

function identifyResearchField(input) {
  const fields = {
    'Computer Science': /\b(algorithm|computing|software|AI|machine learning)\b/i,
    'Psychology': /\b(behavior|cognitive|mental|psychological|personality)\b/i,
    'Economics': /\b(economic|market|finance|trade|monetary)\b/i,
    'Biology': /\b(biological|cell|gene|organism|evolution)\b/i,
    'Physics': /\b(physics|quantum|particle|energy|force)\b/i,
    'Sociology': /\b(social|society|culture|community|demographic)\b/i,
    'Medicine': /\b(medical|health|disease|treatment|clinical)\b/i
  };
  
  for (const [field, pattern] of Object.entries(fields)) {
    if (pattern.test(input)) return field;
  }
  return 'Interdisciplinary Studies';
}

function suggestMethodologies(input, field) {
  const methodologies = {
    'Computer Science': ['Experimental evaluation', 'Complexity analysis', 'Simulation studies'],
    'Psychology': ['Controlled experiments', 'Longitudinal studies', 'Meta-analysis'],
    'Economics': ['Econometric modeling', 'Game theory', 'Time series analysis'],
    'Biology': ['Laboratory experiments', 'Field studies', 'Genomic analysis'],
    'Physics': ['Mathematical modeling', 'Experimental verification', 'Computational simulation'],
    'Sociology': ['Survey research', 'Ethnographic studies', 'Statistical analysis'],
    'Medicine': ['Clinical trials', 'Systematic reviews', 'Case-control studies']
  };
  
  return methodologies[field] || ['Mixed methods', 'Systematic review', 'Comparative analysis'];
}

module.exports = { enhancedModes };
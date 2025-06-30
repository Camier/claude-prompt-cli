/**
 * Enhancement Templates
 * Standard templates for prompt enhancement
 */

const enhancementModes = {
  balanced: {
    name: 'Balanced',
    description: 'Clear, structured prompts with good context',
    enhance: (input) => `Context:
${input}

Requirements:
- Provide a comprehensive and detailed response
- Structure your answer with clear sections
- Include relevant examples where appropriate
- Validate your reasoning

Expected Output:
A well-structured response that directly addresses the query with appropriate depth and clarity.`
  },
  
  ultrathink: {
    name: 'UltraThink+',
    description: 'Deep reasoning with metacognitive elements',
    enhance: (input) => `[Deep Reasoning Request]

Core Question:
${input}

Reasoning Framework:
1. Initial Analysis:
   - Break down the problem into components
   - Identify key assumptions and constraints
   
2. Step-by-Step Thinking:
   - Work through the problem methodically
   - Show your reasoning at each step
   
3. Metacognitive Reflection:
   - What assumptions am I making?
   - What could I be missing?
   - What alternative approaches exist?
   
4. Confidence Assessment:
   - Rate confidence in each conclusion (high/medium/low)
   - Identify areas of uncertainty
   
5. Validation:
   - Double-check logic and assumptions
   - Consider edge cases
   
Please think deeply and systematically through this problem.`
  },
  
  coding: {
    name: 'Code Task',
    description: 'Optimized for coding tasks',
    enhance: (input) => `Programming Task:
${input}

Technical Requirements:
1. Problem Statement:
   - Clearly understand the requirements
   - Identify input/output specifications

2. Implementation Guidelines:
   - Write clean, readable code
   - Include comprehensive comments
   - Handle edge cases gracefully
   - Optimize for performance where relevant

3. Code Structure:
   - Use appropriate design patterns
   - Follow language best practices
   - Ensure modularity and reusability

4. Testing Approach:
   - Include example test cases
   - Consider boundary conditions
   - Validate error handling

5. Documentation:
   - Explain your approach
   - Document time/space complexity
   - Provide usage examples

Please provide a complete, production-ready solution.`
  },
  
  analysis: {
    name: 'Deep Analysis',
    description: 'Systematic analysis with evidence',
    enhance: (input) => `Analytical Task:
${input}

Analysis Framework:
1. Scope Definition:
   - Clearly define what needs to be analyzed
   - Set boundaries and constraints

2. Data Examination:
   - Identify relevant information
   - Note any data limitations

3. Systematic Analysis:
   - Break down into logical components
   - Examine relationships and patterns
   - Consider multiple perspectives

4. Evidence-Based Reasoning:
   - Support each point with evidence
   - Rate confidence levels
   - Acknowledge uncertainties

5. Synthesis:
   - Draw meaningful conclusions
   - Provide actionable insights
   - Suggest next steps

Structure your response with clear sections and evidence-based reasoning.`
  },
  
  creative: {
    name: 'Creative Plus',
    description: 'Enhanced creative tasks',
    enhance: (input) => `Creative Challenge:
${input}

Creative Guidelines:
- Push beyond conventional boundaries
- Explore multiple creative directions
- Focus on originality and impact
- Include vivid, sensory details
- Consider emotional resonance

Approach:
1. Brainstorm diverse ideas
2. Select the most compelling direction
3. Develop with rich detail
4. Refine for maximum impact

Deliver something memorable and exceptional.`
  }
};

const advancedFrameworks = {
  SPEAR: {
    name: 'SPEAR Framework',
    description: 'Start, Provide, Explain, Ask, Repeat',
    enhance: (input) => `[SPEAR Framework Application]

START: Clear task definition
${input}

PROVIDE: Context and background
- What information is already known
- What resources are available
- What constraints exist

EXPLAIN: Detailed requirements
- Specific objectives to achieve
- Success criteria
- Expected format and depth

ASK: Clarifying questions
- What aspects need the most focus?
- Are there any edge cases to consider?
- What is the priority order?

REPEAT: Iterative refinement
- Initial approach
- Validation steps
- Refinement based on feedback`
  },
  
  COAST: {
    name: 'COAST Framework',
    description: 'Challenge, Objective, Actions, Strategy, Tactics',
    enhance: (input) => `[COAST Framework Application]

CHALLENGE:
${input}

OBJECTIVE:
- Primary goal to achieve
- Measurable success metrics
- Timeline and milestones

ACTIONS:
- Concrete steps to take
- Resources required
- Dependencies to manage

STRATEGY:
- Overall approach
- Key principles to follow
- Risk mitigation plans

TACTICS:
- Specific techniques to employ
- Tools and methods
- Optimization opportunities`
  },
  
  RTF: {
    name: 'RTF Framework',
    description: 'Role, Task, Format',
    enhance: (input) => `[RTF Framework Application]

ROLE: You are an expert professional with deep knowledge in the relevant domain.

TASK:
${input}

FORMAT:
- Structure: Clear sections with headers
- Style: Professional and comprehensive
- Length: Detailed but concise
- Elements: Include examples, explanations, and actionable recommendations`
  }
};

// Import enhanced modes
const { enhancedModes } = require('./enhanced-templates');

module.exports = {
  enhancementModes,
  advancedFrameworks,
  enhancedModes,
  getAllTemplates: () => ({ ...enhancementModes, ...advancedFrameworks, ...enhancedModes })
};
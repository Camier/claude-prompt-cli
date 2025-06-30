#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const clipboardy = require('clipboardy');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
require('dotenv').config();

// Import AI enhancer if available
let AIEnhancer;
try {
  AIEnhancer = require('./lib/ai-enhancer');
} catch (e) {
  // AI enhancer not available
}

// Initialize AI enhancer if token is available
const aiEnhancer = process.env.HF_TOKEN && AIEnhancer ? new AIEnhancer(process.env.HF_TOKEN) : null;

// Enhancement templates and logic
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
  },
  
  custom: {
    name: 'Custom Template',
    description: 'Use a custom template file',
    enhance: (input, template) => template.replace('{{INPUT}}', input)
  }
};

// Enhancement options processor
function applyEnhancements(prompt, options) {
  let enhanced = prompt;
  
  if (options.examples) {
    enhanced += `\n\nExamples:
- [Provide relevant example 1]
- [Provide relevant example 2]`;
  }
  
  if (options.constraints) {
    enhanced += `\n\nConstraints:
- Response length: Comprehensive but concise
- Tone: Professional and clear
- Format: Well-structured with headers`;
  }
  
  if (options.cot) {
    enhanced += `\n\nReasoning Approach:
Think through this step-by-step, showing your work at each stage.`;
  }
  
  if (options.xml) {
    enhanced = `<prompt>
  <context>
    ${prompt}
  </context>
  <requirements>
    ${enhanced.includes('Requirements:') ? enhanced.split('Requirements:')[1].split('\n\n')[0] : 'Provide comprehensive response'}
  </requirements>
  <output_format>
    Structured response with clear sections
  </output_format>
</prompt>`;
  }
  
  if (options.reflect) {
    enhanced += `\n\nReflection Points:
- What assumptions are being made?
- What alternative perspectives exist?
- How confident are you in this approach?`;
  }
  
  return enhanced;
}

// Interactive mode
async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (query) => new Promise((resolve) => rl.question(query, resolve));
  
  console.log(chalk.cyan.bold('\n🧠 Claude Prompt Enhancer - Interactive Mode\n'));
  
  // Select mode
  console.log(chalk.yellow('Available modes:'));
  Object.entries(enhancementModes).forEach(([key, mode], index) => {
    if (key !== 'custom') {
      console.log(`  ${index + 1}. ${chalk.green(key)} - ${mode.description}`);
    }
  });
  
  const modeChoice = await question(chalk.cyan('\nSelect mode (1-5): '));
  const modeKeys = Object.keys(enhancementModes).filter(k => k !== 'custom');
  const selectedMode = modeKeys[parseInt(modeChoice) - 1] || 'balanced';
  
  // Ask about AI enhancement
  let useAI = false;
  if (aiEnhancer) {
    const aiChoice = await question(chalk.cyan('Use AI enhancement? (y/N): '));
    useAI = aiChoice.toLowerCase() === 'y';
  }
  
  // Get prompt
  console.log(chalk.yellow('\nEnter your prompt (press Enter twice to finish):'));
  let input = '';
  let emptyLines = 0;
  
  rl.on('line', (line) => {
    if (line === '') {
      emptyLines++;
      if (emptyLines >= 2) {
        rl.close();
      }
    } else {
      emptyLines = 0;
      input += line + '\n';
    }
  });
  
  await new Promise((resolve) => rl.on('close', resolve));
  
  // Enhance
  let enhanced;
  if (useAI && aiEnhancer) {
    try {
      console.log(chalk.yellow('\n🤖 Using AI enhancement...'));
      enhanced = await aiEnhancer.enhance(input.trim(), selectedMode);
    } catch (error) {
      console.log(chalk.red(`AI enhancement failed: ${error.message}`));
      console.log(chalk.yellow('Falling back to template enhancement...'));
      enhanced = enhancementModes[selectedMode].enhance(input.trim());
    }
  } else {
    enhanced = enhancementModes[selectedMode].enhance(input.trim());
  }
  
  console.log(chalk.green.bold('\n✨ Enhanced Prompt:\n'));
  console.log(enhanced);
  
  // Copy to clipboard
  try {
    await clipboardy.write(enhanced);
    console.log(chalk.cyan('\n📋 Copied to clipboard!'));
  } catch (err) {
    console.log(chalk.yellow('\n⚠️  Could not copy to clipboard'));
  }
}

// Main program
program
  .name('enhance')
  .description('CLI tool for enhancing Claude prompts')
  .version('2.0.0');

program
  .argument('[prompt]', 'prompt to enhance')
  .option('-m, --mode <mode>', 'enhancement mode', 'balanced')
  .option('-f, --file <path>', 'read prompt from file')
  .option('-o, --output <path>', 'write to file instead of stdout')
  .option('-t, --template <path>', 'use custom template file')
  .option('-c, --clipboard', 'copy result to clipboard')
  .option('--no-color', 'disable colored output')
  .option('-e, --examples', 'add examples section')
  .option('--constraints', 'add constraints section')
  .option('--cot', 'add chain-of-thought reasoning')
  .option('--xml', 'format with XML tags')
  .option('--reflect', 'add metacognitive reflection')
  .option('-i, --interactive', 'interactive mode')
  .option('-l, --list', 'list available modes')
  .option('--ai', 'use AI enhancement (requires HF_TOKEN)')
  .option('--ai-model <model>', 'AI model tier: fast, balanced, deep', 'balanced')
  .option('--no-cache', 'disable AI response caching')
  .option('--stats', 'show AI usage statistics')
  .option('--clear-cache', 'clear AI response cache')
  .option('--check-models', 'check AI model availability')
  .action(async (prompt, options) => {
    // Show stats
    if (options.stats) {
      if (!aiEnhancer) {
        console.log(chalk.yellow('AI enhancement not available. Set HF_TOKEN environment variable.'));
        return;
      }
      const stats = aiEnhancer.getStats();
      console.log(chalk.cyan.bold('\n📊 AI Enhancement Statistics\n'));
      console.log(`Daily requests: ${chalk.green(stats.daily)}`);
      console.log(`Hourly requests: ${chalk.green(stats.hourly)}`);
      console.log(`Cache size: ${chalk.green(stats.cacheSize)} entries`);
      console.log(`Cache hit rate: ${chalk.green(stats.cacheHitRate)} (${stats.cacheHits} hits / ${stats.cacheMisses} misses)`);
      console.log(`Disk operations: ${chalk.blue(stats.diskReads)} reads, ${chalk.blue(stats.diskWrites)} writes`);
      console.log(`Cache location: ${chalk.gray(stats.cacheLocation)}`);
      console.log(`Last reset: ${chalk.gray(stats.lastReset)}`);
      return;
    }
    
    // Clear cache
    if (options.clearCache) {
      if (!aiEnhancer) {
        console.log(chalk.yellow('AI enhancement not available.'));
        return;
      }
      const result = await aiEnhancer.clearCache();
      console.log(chalk.green(result));
      return;
    }
    
    // Check models
    if (options.checkModels) {
      console.log(chalk.cyan.bold('\n🔍 Checking AI Model Availability...\n'));
      
      if (!aiEnhancer) {
        console.log(chalk.red('❌ AI enhancement not configured'));
        console.log(chalk.yellow('\nTo enable AI features:'));
        console.log('1. Get HF token from: https://huggingface.co/settings/tokens');
        console.log('2. Set environment variable: export HF_TOKEN=your_token_here');
        return;
      }
      
      const results = await aiEnhancer.checkModels();
      
      console.log(chalk.white.bold('Model Status:\n'));
      for (const [tier, result] of Object.entries(results)) {
        const icon = result.available ? '✅' : '❌';
        const status = result.available ? chalk.green('Available') : chalk.red('Not Available');
        console.log(`${icon} ${chalk.cyan(tier.padEnd(10))}: ${result.model}`);
        console.log(`   Status: ${status}`);
        if (result.responseTime) {
          console.log(`   Response: ${chalk.gray(result.responseTime + 'ms')}`);
        }
        if (result.error) {
          console.log(`   Error: ${chalk.red(result.error)}`);
        }
        if (result.suggestion) {
          console.log(`   Suggestion: ${chalk.yellow(result.suggestion)}`);
        }
        console.log();
      }
      
      console.log(chalk.gray('\nNote: Model availability depends on your HF subscription tier.'));
      console.log(chalk.gray('Free accounts have limited access to models.\n'));
      return;
    }
    
    // List modes
    if (options.list) {
      console.log(chalk.cyan.bold('\nAvailable Enhancement Modes:\n'));
      Object.entries(enhancementModes).forEach(([key, mode]) => {
        if (key !== 'custom') {
          console.log(`  ${chalk.green(key.padEnd(12))} - ${mode.description}`);
        }
      });
      console.log('\nUse: enhance "your prompt" -m <mode>\n');
      
      if (aiEnhancer) {
        console.log(chalk.cyan.bold('AI Models Available:\n'));
        console.log(`  ${chalk.green('fast'.padEnd(12))} - Google Flan-T5 XL (fastest)`);
        console.log(`  ${chalk.green('balanced'.padEnd(12))} - Mixtral 8x7B (recommended)`);
        console.log(`  ${chalk.green('deep'.padEnd(12))} - Llama 2 70B (highest quality)\n`);
      }
      return;
    }
    
    // Interactive mode
    if (options.interactive) {
      return interactiveMode();
    }
    
    // Get input
    let input = prompt;
    
    if (options.file) {
      try {
        // Security: Validate file path to prevent directory traversal
        const filePath = path.resolve(options.file);
        const allowedDir = process.cwd();
        
        if (!filePath.startsWith(allowedDir)) {
          console.error(chalk.red('Error: File path must be within current directory'));
          process.exit(1);
        }
        
        input = await fs.readFile(filePath, 'utf8');
      } catch (err) {
        // Security: Don't expose full system paths or internal details
        const safeMessage = err.code === 'ENOENT' ? 'File not found' : 
                           err.code === 'EACCES' ? 'Permission denied' :
                           'Error reading file';
        console.error(chalk.red(`Error reading file: ${safeMessage}`));
        process.exit(1);
      }
    } else if (!input) {
      // Read from stdin
      input = await new Promise((resolve) => {
        let data = '';
        process.stdin.on('data', chunk => data += chunk);
        process.stdin.on('end', () => resolve(data));
      });
    }
    
    if (!input.trim()) {
      console.error(chalk.red('Error: No prompt provided'));
      console.log('Use: enhance "your prompt" or enhance -i for interactive mode');
      process.exit(1);
    }
    
    // Security: Limit input size to prevent DoS attacks
    const MAX_PROMPT_LENGTH = 50000; // 50KB limit
    if (input.length > MAX_PROMPT_LENGTH) {
      console.error(chalk.red(`Error: Prompt too long (${input.length} chars). Maximum allowed: ${MAX_PROMPT_LENGTH} chars`));
      process.exit(1);
    }
    
    // Get enhancement mode
    let mode = options.mode.toLowerCase();
    if (!enhancementModes[mode] && mode !== 'custom') {
      console.error(chalk.red(`Unknown mode: ${mode}`));
      console.log('Available modes:', Object.keys(enhancementModes).filter(k => k !== 'custom').join(', '));
      process.exit(1);
    }
    
    // Apply enhancement
    let enhanced;
    
    // Check if AI enhancement is requested
    if (options.ai) {
      if (!aiEnhancer) {
        console.error(chalk.red('AI enhancement not available. Please set HF_TOKEN environment variable.'));
        console.log(chalk.yellow('\nTo enable AI enhancement:'));
        console.log('1. Get your HF token from: https://huggingface.co/settings/tokens');
        console.log('2. Create a .env file with: HF_TOKEN=your_token_here');
        console.log('3. Or export HF_TOKEN=your_token_here');
        process.exit(1);
      }
      
      try {
        const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let spinnerIndex = 0;
        let spinnerInterval;
        
        if (!options.noColor) {
          console.log(chalk.yellow('\n🤖 Using AI enhancement...'));
          
          // Start spinner
          spinnerInterval = setInterval(() => {
            process.stdout.write(`\r${chalk.cyan(spinner[spinnerIndex])} Calling ${options.aiModel} model...    `);
            spinnerIndex = (spinnerIndex + 1) % spinner.length;
          }, 100);
        }
        
        const startTime = Date.now();
        
        enhanced = await aiEnhancer.enhance(input, mode, {
          model: options.aiModel,
          noCache: options.noCache
        });
        
        if (!options.noColor && spinnerInterval) {
          clearInterval(spinnerInterval);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          process.stdout.write(`\r${chalk.green('✓')} AI enhancement complete ${chalk.gray(`(${elapsed}s, cached: ${options.noCache ? 'no' : 'check'})`)}    \n`);
        }
      } catch (error) {
        if (spinnerInterval) {
          clearInterval(spinnerInterval);
          process.stdout.write('\r' + ' '.repeat(50) + '\r'); // Clear spinner line
        }
        console.error(chalk.red(`AI enhancement failed: ${error.message}`));
        console.log(chalk.yellow('Falling back to template enhancement...'));
        enhanced = enhancementModes[mode].enhance(input);
      }
    } else {
      // Use template enhancement
      if (options.template) {
        try {
          // Security: Validate template file path to prevent directory traversal
          const templatePath = path.resolve(options.template);
          const allowedDir = process.cwd();
          
          if (!templatePath.startsWith(allowedDir)) {
            console.error(chalk.red('Error: Template path must be within current directory'));
            process.exit(1);
          }
          
          const template = await fs.readFile(templatePath, 'utf8');
          enhanced = enhancementModes.custom.enhance(input, template);
        } catch (err) {
          console.error(chalk.red(`Error reading template: ${err.message}`));
          process.exit(1);
        }
      } else {
        enhanced = enhancementModes[mode].enhance(input);
      }
    }
    
    // Apply additional options
    enhanced = applyEnhancements(enhanced, options);
    
    // Output
    if (options.output) {
      try {
        // Security: Validate output file path to prevent directory traversal
        const outputPath = path.resolve(options.output);
        const allowedDir = process.cwd();
        
        if (!outputPath.startsWith(allowedDir)) {
          console.error(chalk.red('Error: Output path must be within current directory'));
          process.exit(1);
        }
        
        await fs.writeFile(outputPath, enhanced);
        console.log(chalk.green(`✅ Enhanced prompt saved to ${options.output}`));
      } catch (err) {
        // Security: Don't expose full system paths or internal details
        const safeMessage = err.code === 'ENOENT' ? 'Directory not found' : 
                           err.code === 'EACCES' ? 'Permission denied' :
                           'Error writing file';
        console.error(chalk.red(`Error writing file: ${safeMessage}`));
        process.exit(1);
      }
    } else {
      if (!options.noColor) {
        console.log(chalk.green.bold('\n✨ Enhanced Prompt:\n'));
      }
      console.log(enhanced);
    }
    
    // Copy to clipboard if requested
    if (options.clipboard) {
      try {
        await clipboardy.write(enhanced);
        console.log(chalk.cyan('\n📋 Copied to clipboard!'));
      } catch (err) {
        console.error(chalk.yellow('⚠️  Could not copy to clipboard'));
      }
    }
  });

// Add additional commands
program
  .command('modes')
  .description('Show detailed information about enhancement modes')
  .action(() => {
    console.log(chalk.cyan.bold('\n🧠 Enhancement Modes Guide\n'));
    Object.entries(enhancementModes).forEach(([key, mode]) => {
      if (key !== 'custom') {
        console.log(chalk.green.bold(`${key}:`));
        console.log(`  ${mode.description}`);
        console.log(chalk.gray(`  Use: enhance "prompt" -m ${key}\n`));
      }
    });
    
    if (aiEnhancer) {
      console.log(chalk.cyan.bold('\n🤖 AI Enhancement Available!\n'));
      console.log('Add --ai flag to any command to use AI enhancement.');
      console.log('Example: enhance "your prompt" -m coding --ai\n');
    }
  });

program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.cyan.bold('\n📚 Usage Examples\n'));
    
    const examples = [
      {
        desc: 'Basic enhancement',
        cmd: 'enhance "explain recursion"'
      },
      {
        desc: 'UltraThink mode',
        cmd: 'enhance "solve P vs NP" -m ultrathink'
      },
      {
        desc: 'Code mode with examples',
        cmd: 'enhance "write a binary search function" -m coding -e'
      },
      {
        desc: 'AI enhancement',
        cmd: 'enhance "create REST API" -m coding --ai'
      },
      {
        desc: 'AI with deep model',
        cmd: 'enhance "consciousness" -m ultrathink --ai --ai-model deep'
      },
      {
        desc: 'From file with XML output',
        cmd: 'enhance -f prompt.txt --xml -o enhanced.xml'
      },
      {
        desc: 'Interactive mode',
        cmd: 'enhance -i'
      },
      {
        desc: 'Check AI usage stats',
        cmd: 'enhance --stats'
      },
      {
        desc: 'Pipe from another command',
        cmd: 'echo "analyze this data" | enhance -m analysis'
      },
      {
        desc: 'Copy to clipboard',
        cmd: 'enhance "create a landing page" -m creative -c'
      },
      {
        desc: 'Custom template',
        cmd: 'enhance "my prompt" -t my-template.txt'
      }
    ];
    
    examples.forEach(({ desc, cmd }) => {
      console.log(chalk.yellow(`${desc}:`));
      console.log(chalk.gray(`  $ ${cmd}\n`));
    });
  });

// Parse arguments
program.parse(process.argv);

// Show help if no arguments
if (process.argv.length === 2) {
  program.help();
}
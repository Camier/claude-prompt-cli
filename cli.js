#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const clipboardy = require('clipboardy');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const ora = require('ora');
require('dotenv').config();

// Import provider system
const { getRegistry } = require('./lib/providers/registry');
const ConversationHistory = require('./lib/conversation-history');
const TestRunner = require('./lib/test-runner');
const PromptBuilder = require('./lib/prompt-builder');
const ThemeManager = require('./lib/theme-manager');
const UIUtils = require('./lib/ui-utils');

// Initialize systems
const registry = getRegistry();
const history = new ConversationHistory();
const themeManager = new ThemeManager();
const ui = new UIUtils(themeManager);

// Import templates from shared module
const { enhancementModes, advancedFrameworks, enhancedModes } = require('./lib/templates');
const { enhanceWithTemplate, getGroupedModes, modeExists } = require('./lib/template-utils');
const { analyzePrompt, formatSuggestion } = require('./lib/prompt-analyzer');

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

// Interactive mode with provider selection
async function interactiveMode() {
  const theme = themeManager.getTheme();
  
  // Show animated banner
  await ui.showBanner('Claude Enhancer', 'Small');
  console.log(theme.subtitle('Version 3.0 - Enhanced UI Edition\n'));
  
  // Check available providers
  const providers = registry.listProviders();
  const health = await registry.checkHealth();
  
  // Provider selection
  const providerChoices = providers.map(p => ({
    name: `${p.name} ${health[p.name].status === 'healthy' ? theme.colors.success('✓') : theme.colors.error('✗')} ${p.default ? theme.colors.muted('(default)') : ''}`,
    value: p.name,
    disabled: health[p.name].status !== 'healthy'
  }));
  
  // First select provider
  const providerAnswer = await ui.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Select LLM provider:',
      choices: providerChoices
    }
  ]);
  
  // Get available models if Ollama is selected
  let modelChoices = [];
  if (providerAnswer.provider === 'ollama') {
    const provider = registry.getProvider('ollama');
    try {
      const models = await provider.listModels();
      if (models.length > 0) {
        modelChoices = models.map(m => ({
          name: `${m.name} (${m.size})`,
          value: m.id
        }));
      } else {
        console.log(chalk.yellow('⚠️  No Ollama models found. Auto-detection will be used.'));
      }
    } catch (e) {
      console.log(chalk.yellow(`⚠️  Could not list Ollama models: ${e.message}`));
      console.log(chalk.gray('Auto-detection will be used instead.'));
    }
  }
  
  // Build remaining prompts
  const remainingPrompts = [
    {
      type: 'list',
      name: 'mode',
      message: 'Select enhancement mode:',
      choices: [
        { name: theme.colors.muted('── Standard Modes ──'), disabled: true },
        ...Object.entries(enhancementModes).map(([key, mode]) => ({
          name: `${mode.name} - ${mode.description}`,
          value: key
        })),
        { name: theme.colors.muted('── ML-Enhanced Modes ──'), disabled: true },
        ...Object.entries(enhancedModes).map(([key, mode]) => ({
          name: `${theme.colors.accent('✨')} ${mode.name} - ${mode.description}`,
          value: key
        })),
        { name: theme.colors.muted('── Advanced Frameworks ──'), disabled: true },
        ...Object.entries(advancedFrameworks).map(([key, framework]) => ({
          name: `${framework.name} - ${framework.description}`,
          value: key
        }))
      ]
    }
  ];
  
  // Add model selection for Ollama
  if (modelChoices.length > 0) {
    remainingPrompts.push({
      type: 'list',
      name: 'model',
      message: 'Select Ollama model:',
      choices: [
        { name: theme.colors.muted('Auto-detect best model for mode'), value: null },
        ...modelChoices
      ]
    });
  }
  
  remainingPrompts.push(
    {
      type: 'editor',
      name: 'prompt',
      message: 'Enter your prompt (opens in editor):'
    },
    {
      type: 'confirm',
      name: 'useAI',
      message: 'Use AI enhancement?',
      default: true
    }
  );
  
  const remainingAnswers = await ui.prompt(remainingPrompts);
  const answers = { ...providerAnswer, ...remainingAnswers };
  
  // Process enhancement
  const spinner = ora('Enhancing prompt...').start();
  
  try {
    let enhanced;
    const provider = registry.getProvider(answers.provider);
    
    if (answers.useAI) {
      // Use AI enhancement
      const options = {};
      if (answers.model) {
        options.model = answers.model;
      }
      enhanced = await provider.enhance(answers.prompt, answers.mode, options);
    } else {
      // Use template enhancement
      enhanced = enhanceWithTemplate(answers.prompt, answers.mode);
    }
    
    spinner.succeed(theme.success('Enhancement complete!'));
    
    // Display enhanced prompt with animations
    await ui.displayEnhancedPrompt(answers.prompt, enhanced, {
      mode: answers.mode,
      provider: answers.provider,
      useAI: answers.useAI ? 'Yes' : 'No'
    });
    
    // Save to history
    await history.saveInteraction(answers.prompt, enhanced, {
      mode: answers.mode,
      provider: answers.provider,
      useAI: answers.useAI
    });
    
    // Offer actions with enhanced UI
    const actionChoices = [
      { name: `${theme.icons.copy} Copy to clipboard`, value: 'copy' },
      { name: `${theme.icons.save} Save to file`, value: 'save' },
      { name: `${theme.icons.enhance} Try another prompt`, value: 'again' },
      { name: `${theme.icons.cross} Exit`, value: 'exit' }
    ];
    
    const { action } = await ui.prompt([
      {
        type: 'list',
        name: 'action',
        message: theme.prompt('What would you like to do?'),
        choices: actionChoices
      }
    ]);
    
    switch (action) {
      case 'copy':
        await clipboardy.write(enhanced);
        ui.showNotification('Copied to clipboard!', 'success');
        break;
      case 'save':
        const { filename } = await inquirer.prompt([
          {
            type: 'input',
            name: 'filename',
            message: 'Enter filename:',
            default: 'enhanced-prompt.txt'
          }
        ]);
        await fs.writeFile(filename, enhanced);
        console.log(chalk.green(`✅ Saved to ${filename}`));
        break;
      case 'again':
        return interactiveMode();
    }
  } catch (error) {
    spinner.fail(`Enhancement failed: ${error.message}`);
  }
}

// Main program
program
  .name('enhance')
  .description('CLI tool for enhancing prompts with multiple LLM providers')
  .version('3.0.0');

program
  .argument('[prompt]', 'prompt to enhance')
  .option('-m, --mode <mode>', 'enhancement mode (auto-detected if not specified)')
  .option('-p, --provider <provider>', 'LLM provider (ollama, huggingface, etc.)')
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
  .option('-l, --list', 'list available modes and providers')
  .option('--list-models', 'list all available models by provider')
  .option('--use-ai', 'use AI enhancement (default)')
  .option('--no-ai', 'use template enhancement only')
  .option('--model <model>', 'specific model to use')
  .option('--use-cache', 'enable caching (default)')
  .option('--no-cache', 'disable caching')
  .option('--show-stats', 'show usage statistics')
  .option('--clear-cache', 'clear all caches')
  .option('--show-health', 'check provider health')
  .option('--compare', 'compare outputs across providers')
  .option('--continue', 'continue last conversation')
  .option('--history', 'show conversation history')
  .option('--test <file>', 'run prompt tests')
  .option('--build', 'interactive prompt builder')
  .option('--framework <name>', 'use advanced framework (SPEAR, COAST, RTF)')
  .option('--stream', 'stream output in real-time')
  .option('--no-stream', 'disable streaming (default)')
  .option('--pull <model>', 'pull model for Ollama')
  .option('--quickstart', 'quick 2-minute introduction to the tool')
  .option('--wizard', 'guided step-by-step mode selection')
  .option('--examples', 'show example workflows and outputs')
  .action(async (prompt, options) => {
    try {
      // Initialize theme
      await themeManager.initialize();
      const theme = themeManager.getTheme();
      // Provider health check
      if (options.showHealth || options.checkHealth) {
        const health = await registry.checkHealth();
        console.log(chalk.cyan.bold('\n🏥 Provider Health Check\n'));
        
        for (const [name, status] of Object.entries(health)) {
          const icon = status.status === 'healthy' ? '✅' : '❌';
          const color = status.status === 'healthy' ? chalk.green : chalk.red;
          console.log(`${icon} ${chalk.cyan(name.padEnd(15))}: ${color(status.status)}`);
          if (status.models) {
            console.log(`   Models: ${status.models}`);
          }
          if (status.error) {
            console.log(`   Error: ${chalk.yellow(status.error)}`);
          }
        }
        return;
      }
      
      // Show statistics
      if (options.showStats || options.stats) {
        const stats = registry.getUsageStats();
        console.log(chalk.cyan.bold('\n📊 Usage Statistics\n'));
        
        for (const [provider, providerStats] of Object.entries(stats)) {
          console.log(chalk.yellow.bold(`${provider}:`));
          console.log(`  Requests: ${providerStats.requests}`);
          console.log(`  Tokens: ${providerStats.tokens}`);
          if (providerStats.cache) {
            console.log(`  Cache: ${providerStats.cache.size} entries, ${providerStats.cache.hitRate} hit rate`);
          }
          console.log();
        }
        
        // Show history stats
        const historyStats = await history.getStats();
        console.log(chalk.yellow.bold('Conversation History:'));
        console.log(`  Total interactions: ${historyStats.total}`);
        console.log(`  Unique prompts: ${historyStats.unique}`);
        console.log(`  Most used mode: ${historyStats.mostUsedMode}`);
        
        return;
      }
      
      // Clear cache
      if (options.clearCache) {
        const providers = registry.listProviders();
        for (const provider of providers) {
          const instance = registry.getProvider(provider.name);
          if (instance.clearCache) {
            await instance.clearCache();
          }
        }
        await history.clear();
        console.log(chalk.green('✅ All caches cleared successfully'));
        return;
      }
      
      // Continue last conversation
      if (options.continue) {
        const last = await history.getLastInteraction();
        if (!last) {
          console.log(chalk.yellow('No previous conversation found'));
          return;
        }
        
        console.log(chalk.cyan('Continuing from last interaction...'));
        console.log(chalk.gray(`Mode: ${last.mode}, Provider: ${last.provider}`));
        prompt = last.enhanced; // Use last enhanced prompt as starting point
      }
      
      // Show history
      if (options.history) {
        const interactions = await history.getRecent(10);
        console.log(chalk.cyan.bold('\n📜 Recent Interactions\n'));
        
        interactions.forEach((interaction, index) => {
          console.log(chalk.yellow(`[${index + 1}] ${new Date(interaction.timestamp).toLocaleString()}`));
          console.log(`Mode: ${interaction.mode}, Provider: ${interaction.provider}`);
          console.log(`Prompt: ${interaction.prompt.substring(0, 50)}...`);
          console.log();
        });
        return;
      }
      
      // Interactive prompt builder
      if (options.build) {
        const builder = new PromptBuilder();
        const built = await builder.buildInteractive();
        prompt = built;
      }
      
      // Run tests
      if (options.test) {
        const runner = new TestRunner(registry);
        await runner.runTests(options.test);
        return;
      }
      
      // Pull model for Ollama
      if (options.pull) {
        const ollama = registry.getProvider('ollama');
        await ollama.pullModel(options.pull);
        return;
      }
      
      // Quickstart guide
      if (options.quickstart) {
        console.log(chalk.cyan.bold('\n🚀 Welcome to Claude Prompt CLI - Quick Start Guide\n'));
        
        console.log(chalk.yellow('Step 1: Try your first enhancement'));
        console.log('   enhance "write a hello world function" --mode coding');
        console.log('   → Gets optimized prompt for programming tasks\n');
        
        console.log(chalk.yellow('Step 2: Explore different modes'));
        console.log('   enhance --list');
        console.log('   → See all available modes by category\n');
        
        console.log(chalk.yellow('Step 3: Choose your provider'));
        console.log('   enhance --list-models');
        console.log('   → See available AI models and their capabilities\n');
        
        console.log(chalk.yellow('Step 4: Get mode-specific help'));
        console.log('   enhance --examples');
        console.log('   → See example workflows for different tasks\n');
        
        console.log(chalk.green('🎯 Recommended for beginners: Use --mode standard for most tasks\n'));
        console.log(chalk.gray('💡 Pro tip: Use --wizard for guided mode selection\n'));
        
        return;
      }
      
      // Guided wizard
      if (options.wizard) {
        console.log(chalk.cyan.bold('\n🧙 Mode Selection Wizard\n'));
        
        console.log(chalk.yellow('What type of task are you working on?\n'));
        console.log('1. 📝 Writing or general text enhancement');
        console.log('2. 💻 Programming or technical documentation'); 
        console.log('3. 🔍 Analysis or research tasks');
        console.log('4. 🎨 Creative writing or brainstorming');
        console.log('5. 🧠 Complex reasoning or problem-solving\n');
        
        console.log(chalk.green('Recommendations by task type:'));
        console.log('1. Writing → --mode standard (clear, structured)');
        console.log('2. Programming → --mode coding (optimized for code)');
        console.log('3. Analysis → --mode analysis (systematic reasoning)');
        console.log('4. Creative → --mode creative (enhanced creativity)');
        console.log('5. Complex → --mode ultrathink (deep reasoning)\n');
        
        console.log(chalk.cyan('💡 Advanced users: Try --mode adaptive for AI that adjusts to complexity\n'));
        console.log(chalk.gray('Example: enhance "your prompt here" --mode coding --provider ollama\n'));
        
        return;
      }
      
      // Show examples
      if (options.examples) {
        console.log(chalk.cyan.bold('\n📚 Example Workflows\n'));
        
        console.log(chalk.yellow.bold('🔰 Beginner Examples:\n'));
        console.log(chalk.green('General writing:'));
        console.log('   enhance "explain quantum computing" --mode standard');
        console.log('   → Clear, structured explanation with examples\n');
        
        console.log(chalk.green('Code generation:'));
        console.log('   enhance "create a REST API endpoint" --mode coding');
        console.log('   → Complete code with tests and documentation\n');
        
        console.log(chalk.yellow.bold('🚀 Intermediate Examples:\n'));
        console.log(chalk.green('Research analysis:'));
        console.log('   enhance "analyze market trends" --mode analysis');
        console.log('   → Systematic analysis with evidence\n');
        
        console.log(chalk.green('Creative projects:'));
        console.log('   enhance "story about time travel" --mode creative');
        console.log('   → Enhanced creative brief with techniques\n');
        
        console.log(chalk.yellow.bold('⚡ Advanced Examples:\n'));
        console.log(chalk.green('AI-powered adaptation:'));
        console.log('   enhance "complex problem" --mode adaptive --provider huggingface');
        console.log('   → AI analyzes complexity and adjusts approach\n');
        
        console.log(chalk.green('Deep reasoning:'));
        console.log('   enhance "philosophical question" --mode ultrathink');
        console.log('   → Metacognitive reflection and validation\n');
        
        console.log(chalk.cyan('💡 Tips:'));
        console.log('• Use --no-ai for template-only enhancement (faster)');
        console.log('• Use --list-models to see provider capabilities');
        console.log('• Use --interactive for guided conversations\n');
        
        return;
      }
      
      // List modes and providers
      if (options.list) {
        const modes = getGroupedModes();
        
        console.log(chalk.cyan.bold('\n📝 Standard Modes (recommended):\n'));
        modes.standard.forEach(mode => {
          console.log(`  ${chalk.green(mode.key.padEnd(12))} - ${mode.description}`);
        });
        
        console.log(chalk.cyan.bold('\n🚀 Advanced Modes (AI-powered):\n'));
        modes.advanced.forEach(mode => {
          console.log(`  ${chalk.yellow(mode.key.padEnd(15))} - ${mode.description}`);
        });
        
        console.log(chalk.cyan.bold('\n🧠 Structured Frameworks:\n'));
        modes.frameworks.forEach(framework => {
          console.log(`  ${chalk.blue(framework.key.padEnd(12))} - ${framework.description}`);
        });
        
        console.log(chalk.cyan.bold('\nAvailable Providers:\n'));
        const providers = registry.listProviders();
        
        for (const provider of providers) {
          try {
            const providerInstance = registry.getProvider(provider.name);
            let modelCount = '';
            
            if (providerInstance && typeof providerInstance.listModels === 'function') {
              const models = await providerInstance.listModels();
              modelCount = models && models.length > 0 ? chalk.gray(` (${models.length} models)`) : chalk.gray(' (0 models)');
            }
            
            console.log(`  ${chalk.green(provider.name.padEnd(12))} ${provider.default ? '(default)' : ''}${modelCount}`);
          } catch (error) {
            console.log(`  ${chalk.green(provider.name.padEnd(12))} ${provider.default ? '(default)' : ''}${chalk.gray(' (unavailable)')}`);
          }
        }
        
        console.log(chalk.cyan('\n💡 Use --list-models to see detailed model information'));
        
        return;
      }
      
      // List models by provider
      if (options.listModels) {
        console.log(chalk.cyan.bold('\n🤖 Available Models by Provider\n'));
        
        const providers = registry.listProviders();
        
        for (const provider of providers) {
          try {
            const providerInstance = registry.getProvider(provider.name);
            if (providerInstance && typeof providerInstance.listModels === 'function') {
              const models = await providerInstance.listModels();
              
              console.log(chalk.green.bold(`\n${provider.name.toUpperCase()}${provider.default ? ' (default)' : ''}:\n`));
              
              if (models && models.length > 0) {
                models.forEach(model => {
                  const tierInfo = model.tier ? ` (${model.tier})` : '';
                  const maxTokens = model.maxTokens ? ` - ${model.maxTokens} tokens` : '';
                  const rateLimit = model.rateLimit ? ` - ${model.rateLimit}ms rate limit` : '';
                  
                  console.log(`  ${chalk.yellow(model.id || model.name)}`);
                  if (model.name && model.id !== model.name) {
                    console.log(`    ${chalk.gray(model.name)}`);
                  }
                  if (tierInfo || maxTokens || rateLimit) {
                    console.log(`    ${chalk.gray(tierInfo + maxTokens + rateLimit)}`);
                  }
                });
              } else {
                console.log(`  ${chalk.gray('No models available or provider not initialized')}`);
              }
            } else {
              console.log(chalk.green.bold(`\n${provider.name.toUpperCase()}:\n`));
              console.log(`  ${chalk.gray('Model listing not supported by this provider')}`);
            }
          } catch (error) {
            console.log(chalk.green.bold(`\n${provider.name.toUpperCase()}:\n`));
            console.log(`  ${chalk.red('Error listing models:')} ${chalk.gray('Provider may not be configured')}`);
          }
        }
        
        console.log(chalk.cyan('\n💡 Tip: Use --model <model-id> to specify a model, or --provider <name> to choose provider\n'));
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
          const filePath = path.resolve(options.file);
          const allowedDir = process.cwd();
          
          if (!filePath.startsWith(allowedDir)) {
            console.error(chalk.red('❌ Security Error: File path must be within current directory'));
            console.error(chalk.yellow('💡 Tip: Use relative paths like "./myfile.txt" or absolute paths within this directory'));
            process.exit(1);
          }
          
          input = await fs.readFile(filePath, 'utf8');
        } catch (err) {
          if (err.code === 'ENOENT') {
            console.error(chalk.red('❌ File not found: ' + options.file));
            console.error(chalk.yellow('💡 Check the file path and try again'));
          } else if (err.code === 'EACCES') {
            console.error(chalk.red('❌ Permission denied: Cannot read ' + options.file));
            console.error(chalk.yellow('💡 Check file permissions or try a different file'));
          } else {
            console.error(chalk.red('❌ Error reading file: ' + options.file));
            console.error(chalk.yellow('💡 Verify the file exists and is readable'));
          }
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
        console.error(chalk.red('❌ No prompt provided'));
        console.error(chalk.yellow('💡 Usage: enhance "your prompt text"'));
        console.error(chalk.yellow('💡 Or try: enhance --interactive for guided mode'));
        console.error(chalk.yellow('💡 Or use: enhance --quickstart for examples'));
        process.exit(1);
      }
      
      // Security: Limit input size
      const MAX_PROMPT_LENGTH = 50000;
      if (input.length > MAX_PROMPT_LENGTH) {
        console.error(chalk.red(`❌ Prompt too long: ${input.length} characters`));
        console.error(chalk.yellow(`💡 Maximum allowed: ${MAX_PROMPT_LENGTH} characters`));
        console.error(chalk.yellow('💡 Try breaking your prompt into smaller parts'));
        process.exit(1);
      }
      
      // Compare across providers
      if (options.compare) {
        console.log(chalk.cyan.bold('\n🔄 Comparing Providers\n'));
        const results = await registry.compareProviders(input, options);
        
        for (const [provider, result] of Object.entries(results)) {
          console.log(chalk.yellow.bold(`${provider}:`));
          if (result.success) {
            console.log(`  Time: ${result.time}ms`);
            console.log(`  Tokens: ~${result.tokens}`);
            console.log(`  Response: ${result.response.substring(0, 100)}...`);
          } else {
            console.log(`  Error: ${chalk.red(result.error)}`);
          }
          console.log();
        }
        return;
      }
      
      // Smart mode detection (unless explicitly specified)
      let mode = options.mode;
      let showSuggestion = false;
      
      if (!mode) {
        const analysis = analyzePrompt(input);
        mode = analysis.suggestedMode;
        showSuggestion = true;
        
        console.log(chalk.cyan('\n🧠 Smart Mode Detection:'));
        console.log(formatSuggestion(analysis));
        console.log(chalk.gray('   (Using suggested mode - specify --mode to override)\n'));
      } else if (mode === 'balanced') {
        // Migrate old default to new default
        mode = 'standard';
      }
      
      // Check if using advanced framework
      if (options.framework) {
        mode = options.framework.toUpperCase();
        showSuggestion = false; // Don't show suggestion when framework is explicit
      }
      
      // Determine if AI should be used
      const useAI = options.useAi !== false && options.ai !== false;
      
      // Apply enhancement
      let enhanced;
      
      if (useAI) {
        const spinner = ora('Enhancing with AI...').start();
        
        try {
          // Use HuggingFace as default if no provider specified and Ollama is not available
          let provider;
          if (options.provider) {
            provider = registry.getProvider(options.provider);
          } else {
            // Check if default provider is healthy
            const health = await registry.checkHealth();
            const defaultName = registry.defaultProvider;
            if (health[defaultName]?.status === 'healthy') {
              provider = registry.getProvider();
            } else {
              // Find first healthy provider
              for (const [name, status] of Object.entries(health)) {
                if (status.status === 'healthy') {
                  provider = registry.getProvider(name);
                  console.log(chalk.yellow(`Using ${name} provider (default unavailable)`));
                  break;
                }
              }
              if (!provider) {
                throw new Error('No healthy providers available');
              }
            }
          }
          
          // Handle streaming if requested
          if (options.stream && provider.streamCompletion) {
            spinner.stop();
            console.log(chalk.yellow('Streaming response...\n'));
            
            for await (const chunk of provider.streamCompletion(input, options)) {
              process.stdout.write(chunk);
            }
            console.log('\n');
            return;
          }
          
          enhanced = await provider.enhance(input, mode, options);
          spinner.succeed('AI enhancement complete!');
        } catch (error) {
          spinner.fail(`AI enhancement failed: ${error.message}`);
          
          // Try fallback
          if (!options.provider) {
            try {
              console.log(chalk.yellow('Trying fallback provider...'));
              enhanced = await registry.executeWithFallback(
                provider => provider.enhance(input, mode, options)
              );
            } catch (fallbackError) {
              console.log(chalk.yellow('All AI providers failed. Using template enhancement...'));
              enhanced = enhanceWithTemplate(input, mode);
            }
          } else {
            // Use template as fallback
            enhanced = enhanceWithTemplate(input, mode);
          }
        }
      } else {
        // Use template enhancement
        enhanced = enhanceWithTemplate(input, mode);
      }
      
      // Apply additional options
      enhanced = applyEnhancements(enhanced, options);
      
      // Save to history
      await history.saveInteraction(input, enhanced, {
        mode,
        provider: options.provider || 'template',
        useAI
      });
      
      // Output
      if (options.output) {
        try {
          const outputPath = path.resolve(options.output);
          const allowedDir = process.cwd();
          
          if (!outputPath.startsWith(allowedDir)) {
            console.error(chalk.red('❌ Security Error: Output path must be within current directory'));
            console.error(chalk.yellow('💡 Use relative paths like "./output.txt" for safety'));
            process.exit(1);
          }
          
          await fs.writeFile(outputPath, enhanced);
          console.log(chalk.green(`✅ Enhanced prompt saved to ${options.output}`));
        } catch (err) {
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
    } catch (error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.error(chalk.red('❌ Connection failed: Cannot reach AI provider'));
        console.error(chalk.yellow('💡 Check your network connection and provider status'));
        console.error(chalk.yellow('💡 Try: enhance --show-health to diagnose issues'));
        console.error(chalk.yellow('💡 Or use: enhance --no-ai for template-only mode'));
      } else if (error.message.includes('Rate limit')) {
        console.error(chalk.red('❌ Rate limit exceeded'));
        console.error(chalk.yellow('💡 Wait a moment and try again'));
        console.error(chalk.yellow('💡 Or try: enhance --provider ollama for local processing'));
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        console.error(chalk.red('❌ Authentication failed'));
        console.error(chalk.yellow('💡 Check your API key configuration'));
        console.error(chalk.yellow('💡 For HuggingFace: Set HF_TOKEN environment variable'));
      } else {
        console.error(chalk.red(`❌ Enhancement failed: ${error.message}`));
        console.error(chalk.yellow('💡 Try: enhance --show-health to check provider status'));
        console.error(chalk.yellow('💡 Or use: enhance --no-ai for template-only enhancement'));
      }
      process.exit(1);
    }
  });

// Additional commands
program
  .command('dashboard')
  .description('Show analytics dashboard')
  .action(async () => {
    const { SimpleAnalyticsDashboard } = require('./lib/analytics-dashboard');
    const dashboard = new SimpleAnalyticsDashboard(history, registry);
    await dashboard.show();
  });

program
  .command('providers')
  .description('Manage LLM providers')
  .action(async () => {
    const inquirer = require('inquirer');
    const providers = registry.listProviders();
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'Check provider health',
          'Set default provider',
          'View provider details',
          'Test all providers'
        ]
      }
    ]);
    
    switch (action) {
      case 'Check provider health':
        await program.parseAsync(['', '', '--check-health']);
        break;
      case 'Set default provider':
        const { provider } = await inquirer.prompt([
          {
            type: 'list',
            name: 'provider',
            message: 'Select default provider:',
            choices: providers.map(p => p.name)
          }
        ]);
        registry.setDefaultProvider(provider);
        console.log(chalk.green(`✅ Default provider set to ${provider}`));
        break;
      case 'View provider details':
        // Implementation for viewing details
        break;
      case 'Test all providers':
        await program.parseAsync(['', '', 'test prompt', '--compare']);
        break;
    }
  });

program
  .command('theme')
  .description('Manage CLI themes and visual settings')
  .action(async () => {
    await themeManager.initialize();
    const theme = themeManager.getTheme();
    
    // Show theme selector
    const themes = themeManager.listThemes();
    const choices = themes.map(t => ({
      name: `${t.name} - ${t.description} ${t.isCurrent ? theme.colors.success('(current)') : ''}`,
      value: t.key
    }));
    
    const { action } = await ui.prompt([{
      type: 'list',
      name: 'action',
      message: theme.prompt('Theme Manager'),
      choices: [
        { name: `${theme.icons.enhance} Select Theme`, value: 'select' },
        { name: `${theme.icons.stats} Current Theme Details`, value: 'details' },
        { name: `${theme.icons.settings || '⚙️'} Animation Settings`, value: 'animations' },
        { name: `${theme.icons.cross} Exit`, value: 'exit' }
      ]
    }]);
    
    switch (action) {
      case 'select':
        const { selectedTheme } = await ui.prompt([{
          type: 'list',
          name: 'selectedTheme',
          message: 'Choose a theme:',
          choices
        }]);
        
        await themeManager.setTheme(selectedTheme);
        ui.showNotification(`Theme changed to ${selectedTheme}!`, 'success');
        
        // Show preview
        const newTheme = themeManager.getTheme();
        console.log(newTheme.typography.h2('Theme Preview'));
        console.log(newTheme.success('Success message'));
        console.log(newTheme.error('Error message'));
        console.log(newTheme.warning('Warning message'));
        console.log(newTheme.info('Info message'));
        break;
        
      case 'details':
        console.log(theme.typography.h2(`Current Theme: ${themes.find(t => t.isCurrent).name}`));
        console.log(theme.box(JSON.stringify(theme.colors, null, 2), 'Colors'));
        console.log(theme.box(JSON.stringify(theme.icons, null, 2), 'Icons'));
        break;
        
      case 'animations':
        const { enableAnimations, speed } = await ui.prompt([
          {
            type: 'confirm',
            name: 'enableAnimations',
            message: 'Enable animations?',
            default: themeManager.animations.enabled
          },
          {
            type: 'list',
            name: 'speed',
            message: 'Animation speed:',
            choices: ['fast', 'normal', 'slow'],
            default: themeManager.animations.speed,
            when: (answers) => answers.enableAnimations
          }
        ]);
        
        themeManager.animations = { enabled: enableAnimations, speed: speed || 'normal' };
        await themeManager.saveConfig();
        ui.showNotification('Animation settings updated!', 'success');
        break;
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no arguments
if (process.argv.length === 2) {
  program.help();
}
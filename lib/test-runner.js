const fs = require('fs').promises;
const path = require('path');
const yaml = require('yaml');
const chalk = require('chalk');
const ora = require('ora');

/**
 * Test Runner for Prompt Testing
 * Allows testing prompts against expected outputs
 */
class TestRunner {
  constructor(registry) {
    this.registry = registry;
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0
    };
  }

  /**
   * Run tests from a file
   */
  async runTests(testFile) {
    console.log(chalk.cyan.bold('\n🧪 Running Prompt Tests\n'));
    
    try {
      // Load test file
      const content = await fs.readFile(testFile, 'utf8');
      const tests = testFile.endsWith('.yaml') || testFile.endsWith('.yml') 
        ? yaml.parse(content)
        : JSON.parse(content);
      
      this.results.total = tests.tests?.length || 0;
      
      // Validate test structure
      if (!tests.tests || !Array.isArray(tests.tests)) {
        throw new Error('Invalid test file: missing "tests" array');
      }
      
      // Global configuration
      const globalConfig = {
        provider: tests.provider || null,
        mode: tests.mode || 'balanced',
        model: tests.model || null,
        ...tests.config
      };
      
      // Run each test
      for (let i = 0; i < tests.tests.length; i++) {
        const test = tests.tests[i];
        console.log(chalk.yellow(`\n[${i + 1}/${tests.tests.length}] ${test.name || 'Unnamed test'}`));
        
        if (test.skip) {
          console.log(chalk.gray('  ⏭️  Skipped'));
          this.results.skipped++;
          continue;
        }
        
        await this.runSingleTest(test, globalConfig);
      }
      
      // Show summary
      this.showSummary();
      
      // Return exit code
      return this.results.failed > 0 ? 1 : 0;
      
    } catch (error) {
      console.error(chalk.red(`\nError loading test file: ${error.message}`));
      return 1;
    }
  }

  /**
   * Run a single test
   */
  async runSingleTest(test, globalConfig) {
    const spinner = ora('Running test...').start();
    
    try {
      // Merge configurations
      const config = {
        ...globalConfig,
        ...test.config
      };
      
      // Handle template mode
      let result;
      const startTime = Date.now();
      
      if (config.provider === 'template' || config.useAI === false) {
        // Use template-based enhancement
        const { getAllTemplates } = require('./templates');
        const templates = getAllTemplates();
        const template = templates[config.mode] || templates.balanced;
        result = template.enhance(test.prompt);
      } else {
        // Get provider
        const provider = config.provider 
          ? this.registry.getProvider(config.provider)
          : this.registry.getProvider();
        
        // Run the prompt
        result = await provider.enhance(test.prompt, config.mode, {
          model: config.model,
          ...config.options
        });
      }
      
      const duration = Date.now() - startTime;
      
      // Run assertions
      const assertionResults = await this.runAssertions(result, test.assertions || []);
      
      // Check if all assertions passed
      const allPassed = assertionResults.every(a => a.passed);
      
      if (allPassed) {
        spinner.succeed(`Test passed (${duration}ms)`);
        this.results.passed++;
        
        // Show successful assertions in verbose mode
        if (config.verbose) {
          assertionResults.forEach(a => {
            console.log(chalk.green(`    ✓ ${a.description}`));
          });
        }
      } else {
        spinner.fail(`Test failed (${duration}ms)`);
        this.results.failed++;
        
        // Show failed assertions
        assertionResults.forEach(a => {
          if (!a.passed) {
            console.log(chalk.red(`    ✗ ${a.description}`));
            console.log(chalk.gray(`      ${a.reason}`));
          } else if (config.verbose) {
            console.log(chalk.green(`    ✓ ${a.description}`));
          }
        });
        
        // Show actual output in debug mode
        if (config.debug) {
          console.log(chalk.gray('\n    Actual output:'));
          console.log(chalk.gray(this.indent(result.substring(0, 500) + '...', 6)));
        }
      }
      
      // Save output if requested
      if (test.saveOutput) {
        await this.saveOutput(test.name, result, test.saveOutput);
      }
      
    } catch (error) {
      spinner.fail(`Test error: ${error.message}`);
      this.results.failed++;
    }
  }

  /**
   * Run assertions on the result
   */
  async runAssertions(result, assertions) {
    const assertionResults = [];
    
    for (const assertion of assertions) {
      const assertResult = await this.runAssertion(result, assertion);
      assertionResults.push(assertResult);
    }
    
    return assertionResults;
  }

  /**
   * Run a single assertion
   */
  async runAssertion(result, assertion) {
    // String contains
    if (assertion.contains) {
      const contains = result.includes(assertion.contains);
      return {
        passed: contains,
        description: `Contains "${assertion.contains}"`,
        reason: contains ? '' : `Text not found in output`
      };
    }
    
    // String does not contain
    if (assertion.not_contains) {
      const contains = result.includes(assertion.not_contains);
      return {
        passed: !contains,
        description: `Does not contain "${assertion.not_contains}"`,
        reason: contains ? `Text found in output` : ''
      };
    }
    
    // Regular expression match
    if (assertion.matches) {
      const regex = new RegExp(assertion.matches, assertion.flags || 'i');
      const matches = regex.test(result);
      return {
        passed: matches,
        description: `Matches pattern /${assertion.matches}/`,
        reason: matches ? '' : `Pattern not found in output`
      };
    }
    
    // Length constraints
    if (assertion.min_length) {
      const passed = result.length >= assertion.min_length;
      return {
        passed,
        description: `Length >= ${assertion.min_length}`,
        reason: passed ? '' : `Length is ${result.length}, expected at least ${assertion.min_length}`
      };
    }
    
    if (assertion.max_length) {
      const passed = result.length <= assertion.max_length;
      return {
        passed,
        description: `Length <= ${assertion.max_length}`,
        reason: passed ? '' : `Length is ${result.length}, expected at most ${assertion.max_length}`
      };
    }
    
    // Line count
    if (assertion.min_lines) {
      const lines = result.split('\n').length;
      const passed = lines >= assertion.min_lines;
      return {
        passed,
        description: `At least ${assertion.min_lines} lines`,
        reason: passed ? '' : `Has ${lines} lines, expected at least ${assertion.min_lines}`
      };
    }
    
    // Structure checks
    if (assertion.has_sections) {
      const missingSections = [];
      for (const section of assertion.has_sections) {
        if (!result.includes(section)) {
          missingSections.push(section);
        }
      }
      return {
        passed: missingSections.length === 0,
        description: `Has sections: ${assertion.has_sections.join(', ')}`,
        reason: missingSections.length > 0 ? `Missing sections: ${missingSections.join(', ')}` : ''
      };
    }
    
    // Custom function
    if (assertion.custom) {
      try {
        const fn = eval(assertion.custom);
        const passed = fn(result);
        return {
          passed,
          description: assertion.description || 'Custom assertion',
          reason: passed ? '' : 'Custom assertion failed'
        };
      } catch (error) {
        return {
          passed: false,
          description: assertion.description || 'Custom assertion',
          reason: `Error in custom assertion: ${error.message}`
        };
      }
    }
    
    // Quality checks
    if (assertion.quality) {
      const qualityChecks = this.checkQuality(result, assertion.quality);
      return {
        passed: qualityChecks.passed,
        description: `Quality check: ${assertion.quality}`,
        reason: qualityChecks.reason
      };
    }
    
    return {
      passed: true,
      description: 'Unknown assertion',
      reason: ''
    };
  }

  /**
   * Check quality metrics
   */
  checkQuality(result, qualityType) {
    switch (qualityType) {
      case 'structured':
        // Check if output has clear structure
        const hasHeaders = /^#+\s+.+$/m.test(result) || /^[A-Z][^.]+:$/m.test(result);
        const hasBullets = /^[\-\*]\s+.+$/m.test(result) || /^\d+\.\s+.+$/m.test(result);
        const structuredPassed = hasHeaders || hasBullets;
        return {
          passed: structuredPassed,
          reason: structuredPassed ? '' : 'Output lacks clear structure (headers or bullet points)'
        };
        
      case 'detailed':
        // Check if output is sufficiently detailed
        const wordCount = result.split(/\s+/).length;
        const detailedPassed = wordCount >= 100;
        return {
          passed: detailedPassed,
          reason: detailedPassed ? '' : `Output too brief (${wordCount} words, expected at least 100)`
        };
        
      case 'examples':
        // Check if output includes examples
        const hasExamples = /example|for instance|such as|e\.g\.|like/i.test(result);
        return {
          passed: hasExamples,
          reason: hasExamples ? '' : 'Output lacks examples'
        };
        
      case 'actionable':
        // Check if output is actionable
        const hasActions = /should|must|need to|follow these|step \d+|first|then|finally/i.test(result);
        return {
          passed: hasActions,
          reason: hasActions ? '' : 'Output lacks actionable guidance'
        };
        
      default:
        return {
          passed: true,
          reason: ''
        };
    }
  }

  /**
   * Save test output
   */
  async saveOutput(testName, output, saveConfig) {
    try {
      const filename = typeof saveConfig === 'string' 
        ? saveConfig 
        : `test-output-${testName.replace(/\s+/g, '-')}-${Date.now()}.txt`;
      
      await fs.writeFile(filename, output);
      console.log(chalk.gray(`    Output saved to ${filename}`));
    } catch (error) {
      console.error(chalk.yellow(`    Failed to save output: ${error.message}`));
    }
  }

  /**
   * Show test summary
   */
  showSummary() {
    console.log(chalk.cyan.bold('\n📊 Test Summary\n'));
    
    const total = this.results.total;
    const passed = this.results.passed;
    const failed = this.results.failed;
    const skipped = this.results.skipped;
    
    console.log(`Total:   ${total}`);
    console.log(`Passed:  ${chalk.green(passed)} (${this.percentage(passed, total)}%)`);
    console.log(`Failed:  ${chalk.red(failed)} (${this.percentage(failed, total)}%)`);
    console.log(`Skipped: ${chalk.gray(skipped)} (${this.percentage(skipped, total)}%)`);
    
    if (failed === 0 && passed > 0) {
      console.log(chalk.green.bold('\n✅ All tests passed!'));
    } else if (failed > 0) {
      console.log(chalk.red.bold(`\n❌ ${failed} test(s) failed`));
    }
  }

  /**
   * Calculate percentage
   */
  percentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  /**
   * Indent text
   */
  indent(text, spaces) {
    const indent = ' '.repeat(spaces);
    return text.split('\n').map(line => indent + line).join('\n');
  }

  /**
   * Create example test file
   */
  static async createExampleTestFile(filename = 'prompt-tests.yaml') {
    const exampleTests = `# Prompt Enhancement Test Suite
# Run with: enhance --test prompt-tests.yaml

provider: ollama  # or huggingface, openai, etc.
mode: balanced    # default mode for all tests

config:
  verbose: true   # Show all assertion results
  debug: false    # Show actual outputs on failure

tests:
  - name: "Basic enhancement test"
    prompt: "explain recursion"
    assertions:
      - contains: "recursion"
      - contains: "function"
      - min_length: 200
      - quality: structured

  - name: "Code generation accuracy"
    mode: coding
    prompt: "write a binary search function"
    assertions:
      - contains: "function binarySearch"
      - contains: "while"
      - contains: "left"
      - contains: "right"
      - not_contains: "console.log"
      - matches: "return\\s+(\\-1|null|false)"
      - quality: detailed

  - name: "Deep reasoning test"
    mode: ultrathink
    prompt: "analyze the trolley problem"
    assertions:
      - has_sections: ["Analysis", "Perspectives", "Conclusion"]
      - contains: "ethical"
      - contains: "utilitarian"
      - min_lines: 20
      - quality: structured

  - name: "Creative writing test"
    mode: creative
    prompt: "write a haiku about programming"
    assertions:
      - matches: "\\b\\w+\\b.*\\n.*\\b\\w+\\b.*\\n.*\\b\\w+\\b"  # Three lines
      - max_length: 100
      - not_contains: "function"

  - name: "Analysis framework test"
    mode: analysis
    prompt: "analyze market trends"
    assertions:
      - contains: "data"
      - contains: "trends"  
      - has_sections: ["Scope", "Analysis", "Conclusions"]
      - quality: actionable

  - name: "SPEAR framework test"
    framework: SPEAR
    prompt: "implement user authentication"
    assertions:
      - contains: "START"
      - contains: "PROVIDE"
      - contains: "EXPLAIN"
      - contains: "ASK"
      - quality: structured

  - name: "Skip this test"
    skip: true
    prompt: "this won't run"
    assertions:
      - contains: "anything"

  - name: "Custom assertion test"
    prompt: "list 5 benefits"
    assertions:
      - custom: "(result) => (result.match(/\\d+\\./g) || []).length >= 5"
        description: "Has at least 5 numbered items"

  - name: "Performance test"
    prompt: "quick response"
    config:
      max_tokens: 100
    assertions:
      - max_length: 500
    saveOutput: true  # Save output to file
`;

    await fs.writeFile(filename, exampleTests);
    console.log(chalk.green(`✅ Created example test file: ${filename}`));
  }
}

module.exports = TestRunner;
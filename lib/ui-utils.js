const ora = require('ora');
const inquirer = require('inquirer');
const Table = require('cli-table3');
const gradient = require('gradient-string');
const figlet = require('figlet');
const boxen = require('boxen');

/**
 * Enhanced UI Utilities for CLI
 * Provides animations, gradients, and visual effects
 */
class UIUtils {
  constructor(themeManager) {
    this.theme = themeManager;
    this.animationSpeed = 30; // ms between frames
  }

  /**
   * Animated banner with gradient text
   */
  async showBanner(text = 'Claude Prompt Enhancer', style = 'Standard') {
    return new Promise((resolve) => {
      figlet(text, { font: style }, (err, data) => {
        if (err) {
          console.log(this.theme.getTheme().title(text));
          resolve();
          return;
        }
        
        // Apply gradient based on current theme
        const theme = this.theme.getTheme();
        const gradientColors = this.getGradientColors();
        const gradientText = gradient(gradientColors)(data);
        
        console.log('\n' + gradientText + '\n');
        resolve();
      });
    });
  }

  /**
   * Get gradient colors based on current theme
   */
  getGradientColors() {
    const themeName = this.theme.currentTheme;
    const gradients = {
      default: ['cyan', 'blue'],
      darkMode: ['#00D9FF', '#00FF88'],
      neon: ['#FF00FF', '#00FFFF', '#FFFF00'],
      minimal: ['gray', 'white'],
      forest: ['#228B22', '#8FBC8F', '#FFD700']
    };
    
    return gradients[themeName] || gradients.default;
  }

  /**
   * Enhanced loading spinner with multiple styles
   */
  createSpinner(text, style = 'default') {
    const theme = this.theme.getTheme();
    const spinnerConfig = this.theme.getSpinner(text);
    
    const spinnerStyles = {
      default: spinnerConfig,
      dots: {
        frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
        interval: 80
      },
      pulse: {
        frames: ['◯', '◉', '●', '◉'],
        interval: 200
      },
      wave: {
        frames: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂'],
        interval: 100
      },
      bounce: {
        frames: ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'],
        interval: 120
      }
    };
    
    const selectedStyle = spinnerStyles[style] || spinnerStyles.default;
    
    return ora({
      text: spinnerConfig.text,
      spinner: selectedStyle,
      color: 'cyan'
    });
  }

  /**
   * Progress bar with animations
   */
  async showProgress(task, steps, callback) {
    const theme = this.theme.getTheme();
    const total = steps.length;
    
    console.log(theme.h2(task));
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const spinner = this.createSpinner(step.text, 'dots');
      spinner.start();
      
      try {
        await callback(step, i);
        spinner.succeed(theme.colors.success(`${step.text} ${theme.icons.checkmark}`));
      } catch (error) {
        spinner.fail(theme.colors.error(`${step.text} ${theme.icons.cross}`));
        throw error;
      }
      
      // Show progress bar
      const progress = theme.progressBar(i + 1, total, 40);
      console.log(theme.colors.dim(`  ${progress}`));
    }
  }

  /**
   * Animated text reveal
   */
  async typeText(text, speed = 30) {
    const theme = this.theme.getTheme();
    const chars = text.split('');
    let output = '';
    
    for (const char of chars) {
      output += char;
      process.stdout.write(`\r${theme.colors.primary(output)}`);
      await new Promise(resolve => setTimeout(resolve, speed));
    }
    console.log(); // New line after completion
  }

  /**
   * Create styled table
   */
  createTable(headers, rows, style = 'default') {
    const theme = this.theme.getTheme();
    
    const tableStyles = {
      default: {
        head: [],
        border: [],
        'padding-left': 2,
        'padding-right': 2
      },
      compact: {
        head: [],
        border: [],
        'padding-left': 1,
        'padding-right': 1,
        compact: true
      },
      fancy: {
        chars: {
          'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
          'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
          'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
          'right': '║', 'right-mid': '╢', 'middle': '│'
        },
        style: {
          head: [],
          border: []
        }
      }
    };
    
    const tableConfig = tableStyles[style] || tableStyles.default;
    const table = new Table({
      ...tableConfig,
      head: headers.map(h => theme.colors.accent(h))
    });
    
    rows.forEach(row => {
      table.push(row.map(cell => theme.colors.primary(cell)));
    });
    
    return table.toString();
  }

  /**
   * Enhanced prompt with theme support
   */
  async prompt(questions) {
    const theme = this.theme.getTheme();
    
    // Apply theme to questions
    const themedQuestions = questions.map(q => ({
      ...q,
      prefix: theme.icons.arrow + ' ',
      transformer: q.transformer || ((input) => theme.colors.accent(input))
    }));
    
    return inquirer.prompt(themedQuestions);
  }

  /**
   * Notification box
   */
  showNotification(message, type = 'info', options = {}) {
    const theme = this.theme.getTheme();
    const types = {
      info: { borderColor: 'cyan', icon: theme.icons.info },
      success: { borderColor: 'green', icon: theme.icons.success },
      warning: { borderColor: 'yellow', icon: theme.icons.warning },
      error: { borderColor: 'red', icon: theme.icons.error }
    };
    
    const config = types[type] || types.info;
    
    const box = boxen(`${config.icon} ${message}`, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: config.borderColor,
      ...options
    });
    
    console.log(box);
  }

  /**
   * Animated transitions between screens
   */
  async transition(style = 'fade') {
    const transitions = {
      fade: async () => {
        for (let i = 0; i < 5; i++) {
          process.stdout.write('\n');
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      },
      slide: async () => {
        const width = process.stdout.columns || 80;
        for (let i = 0; i < width; i += 10) {
          process.stdout.write('\r' + ' '.repeat(i) + '░'.repeat(Math.min(10, width - i)));
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        console.log('\r' + ' '.repeat(width));
      },
      clear: () => {
        console.clear();
      }
    };
    
    const transition = transitions[style] || transitions.fade;
    await transition();
  }

  /**
   * Display enhanced prompt output
   */
  async displayEnhancedPrompt(original, enhanced, metadata = {}) {
    const theme = this.theme.getTheme();
    
    // Animated header
    await this.transition('slide');
    console.log(theme.typography.h1('Enhanced Prompt'));
    
    // Original prompt box
    console.log(theme.typography.h3('Original:'));
    console.log(theme.box(original, 'Input'));
    
    // Processing animation
    const spinner = this.createSpinner('Enhancing prompt...', 'pulse');
    spinner.start();
    await new Promise(resolve => setTimeout(resolve, 1000));
    spinner.succeed(theme.success('Enhancement complete!'));
    
    // Enhanced prompt with animation
    console.log(theme.typography.h3('Enhanced:'));
    if (this.theme.animations.enabled) {
      await this.typeText(enhanced.substring(0, 200) + '...', 10);
      console.log(theme.colors.primary(enhanced.substring(200)));
    } else {
      console.log(theme.box(enhanced, 'Output'));
    }
    
    // Metadata
    if (Object.keys(metadata).length > 0) {
      console.log(theme.typography.h3('Details:'));
      const metaTable = this.createTable(
        ['Property', 'Value'],
        Object.entries(metadata).map(([k, v]) => [k, String(v)]),
        'compact'
      );
      console.log(metaTable);
    }
  }

  /**
   * Interactive menu with animations
   */
  async showMenu(title, choices, description) {
    const theme = this.theme.getTheme();
    
    await this.showBanner(title, 'Small');
    
    if (description) {
      console.log(theme.typography.quote(description));
    }
    
    const answer = await this.prompt([{
      type: 'list',
      name: 'choice',
      message: theme.prompt('Select an option:'),
      choices: choices.map(choice => ({
        ...choice,
        name: `${theme.icons.arrow} ${choice.name}`
      }))
    }]);
    
    return answer.choice;
  }
}

module.exports = UIUtils;
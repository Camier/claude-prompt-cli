const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * Theme Manager for CLI Aesthetic Enhancement
 * Provides customizable color schemes, typography, and visual elements
 */
class ThemeManager {
  constructor() {
    this.configPath = path.join(os.homedir(), '.cache', 'claude-enhancer', 'theme-config.json');
    this.themes = {
      default: {
        name: 'Default',
        description: 'Classic terminal colors',
        colors: {
          primary: chalk.cyan,
          secondary: chalk.green,
          accent: chalk.yellow,
          error: chalk.red,
          warning: chalk.yellow,
          info: chalk.blue,
          success: chalk.green,
          muted: chalk.gray,
          bold: chalk.bold,
          dim: chalk.dim,
          highlight: chalk.bgCyan.black
        },
        icons: {
          success: '✅',
          error: '❌',
          warning: '⚠️',
          info: 'ℹ️',
          prompt: '🧠',
          enhance: '✨',
          save: '💾',
          copy: '📋',
          health: '🏥',
          stats: '📊',
          history: '📜',
          loading: '⏳',
          checkmark: '✓',
          cross: '✗',
          arrow: '→',
          bullet: '•'
        }
      },
      darkMode: {
        name: 'Dark Mode',
        description: 'Optimized for dark terminals with reduced eye strain',
        colors: {
          primary: chalk.hex('#00D9FF'),
          secondary: chalk.hex('#00FF88'),
          accent: chalk.hex('#FFD700'),
          error: chalk.hex('#FF6B6B'),
          warning: chalk.hex('#FFA500'),
          info: chalk.hex('#4ECDC4'),
          success: chalk.hex('#00FF88'),
          muted: chalk.hex('#6C757D'),
          bold: chalk.bold,
          dim: chalk.dim,
          highlight: chalk.bgHex('#1A1A2E').hex('#00D9FF')
        },
        icons: {
          success: '✨',
          error: '🚫',
          warning: '⚡',
          info: '💡',
          prompt: '🎯',
          enhance: '🚀',
          save: '📁',
          copy: '📝',
          health: '💊',
          stats: '📈',
          history: '🕒',
          loading: '🔄',
          checkmark: '✔',
          cross: '✖',
          arrow: '➜',
          bullet: '▸'
        }
      },
      neon: {
        name: 'Neon',
        description: 'Vibrant cyberpunk-inspired theme',
        colors: {
          primary: chalk.hex('#FF00FF'),
          secondary: chalk.hex('#00FFFF'),
          accent: chalk.hex('#FFFF00'),
          error: chalk.hex('#FF0066'),
          warning: chalk.hex('#FF9900'),
          info: chalk.hex('#00CCFF'),
          success: chalk.hex('#00FF00'),
          muted: chalk.hex('#666666'),
          bold: chalk.bold,
          dim: chalk.dim,
          highlight: chalk.bgHex('#FF00FF').black
        },
        icons: {
          success: '⚡',
          error: '💥',
          warning: '🔥',
          info: '💫',
          prompt: '🌟',
          enhance: '🎆',
          save: '💿',
          copy: '📱',
          health: '🔬',
          stats: '📊',
          history: '⏰',
          loading: '🌀',
          checkmark: '☑',
          cross: '☒',
          arrow: '▶',
          bullet: '◆'
        }
      },
      minimal: {
        name: 'Minimal',
        description: 'Clean and distraction-free',
        colors: {
          primary: chalk.white,
          secondary: chalk.gray,
          accent: chalk.white.bold,
          error: chalk.red,
          warning: chalk.yellow,
          info: chalk.blue,
          success: chalk.green,
          muted: chalk.gray,
          bold: chalk.bold,
          dim: chalk.dim,
          highlight: chalk.inverse
        },
        icons: {
          success: '+',
          error: '-',
          warning: '!',
          info: 'i',
          prompt: '>',
          enhance: '*',
          save: 's',
          copy: 'c',
          health: 'h',
          stats: '#',
          history: '~',
          loading: '...',
          checkmark: '[x]',
          cross: '[ ]',
          arrow: '->',
          bullet: '-'
        }
      },
      forest: {
        name: 'Forest',
        description: 'Nature-inspired calming colors',
        colors: {
          primary: chalk.hex('#228B22'),
          secondary: chalk.hex('#8FBC8F'),
          accent: chalk.hex('#FFD700'),
          error: chalk.hex('#DC143C'),
          warning: chalk.hex('#FF8C00'),
          info: chalk.hex('#4682B4'),
          success: chalk.hex('#32CD32'),
          muted: chalk.hex('#696969'),
          bold: chalk.bold,
          dim: chalk.dim,
          highlight: chalk.bgHex('#228B22').white
        },
        icons: {
          success: '🌱',
          error: '🍂',
          warning: '🌤️',
          info: '🌿',
          prompt: '🌳',
          enhance: '🌸',
          save: '🗂️',
          copy: '📄',
          health: '🌡️',
          stats: '📊',
          history: '📚',
          loading: '🌀',
          checkmark: '✓',
          cross: '✗',
          arrow: '➤',
          bullet: '🍃'
        }
      }
    };
    
    this.currentTheme = 'default';
    this.customThemes = {};
    this.animations = {
      enabled: true,
      speed: 'normal' // 'fast', 'normal', 'slow'
    };
  }

  /**
   * Initialize theme manager and load saved preferences
   */
  async initialize() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (config.currentTheme && (this.themes[config.currentTheme] || config.customThemes[config.currentTheme])) {
        this.currentTheme = config.currentTheme;
      }
      
      if (config.customThemes) {
        this.customThemes = config.customThemes;
      }
      
      if (config.animations) {
        this.animations = config.animations;
      }
    } catch (error) {
      // Config doesn't exist yet, use defaults
    }
  }

  /**
   * Save current theme configuration
   */
  async saveConfig() {
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
    
    const config = {
      currentTheme: this.currentTheme,
      customThemes: this.customThemes,
      animations: this.animations,
      lastUpdated: new Date().toISOString()
    };
    
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Get current theme
   */
  getTheme() {
    const theme = this.themes[this.currentTheme] || this.customThemes[this.currentTheme] || this.themes.default;
    return {
      ...theme,
      // Helper methods for common patterns
      title: (text) => theme.colors.primary(theme.colors.bold(text)),
      subtitle: (text) => theme.colors.secondary(text),
      error: (text) => theme.colors.error(`${theme.icons.error} ${text}`),
      warning: (text) => theme.colors.warning(`${theme.icons.warning} ${text}`),
      success: (text) => theme.colors.success(`${theme.icons.success} ${text}`),
      info: (text) => theme.colors.info(`${theme.icons.info} ${text}`),
      muted: (text) => theme.colors.muted(text),
      highlight: (text) => theme.colors.highlight(` ${text} `),
      prompt: (text) => `${theme.icons.prompt} ${theme.colors.primary(text)}`,
      enhance: (text) => `${theme.icons.enhance} ${theme.colors.accent(text)}`,
      
      // Box drawing
      box: (content, title = '') => {
        const lines = content.split('\n');
        const maxLength = Math.max(...lines.map(l => l.length), title.length + 2);
        const top = title ? `╭─ ${title} ${'─'.repeat(maxLength - title.length - 3)}╮` : `╭${'─'.repeat(maxLength + 2)}╮`;
        const bottom = `╰${'─'.repeat(maxLength + 2)}╯`;
        const boxed = [
          theme.colors.dim(top),
          ...lines.map(line => theme.colors.dim('│ ') + line.padEnd(maxLength) + theme.colors.dim(' │')),
          theme.colors.dim(bottom)
        ];
        return boxed.join('\n');
      },
      
      // Progress bar
      progressBar: (current, total, width = 30) => {
        const percentage = Math.round((current / total) * 100);
        const filled = Math.round((current / total) * width);
        const empty = width - filled;
        const bar = theme.colors.success('█'.repeat(filled)) + theme.colors.dim('░'.repeat(empty));
        return `${bar} ${theme.colors.accent(`${percentage}%`)}`;
      }
    };
  }

  /**
   * Set theme
   */
  async setTheme(themeName) {
    if (this.themes[themeName] || this.customThemes[themeName]) {
      this.currentTheme = themeName;
      await this.saveConfig();
      return true;
    }
    return false;
  }

  /**
   * List available themes
   */
  listThemes() {
    const allThemes = {
      ...this.themes,
      ...this.customThemes
    };
    
    return Object.entries(allThemes).map(([key, theme]) => ({
      key,
      name: theme.name,
      description: theme.description,
      isCurrent: key === this.currentTheme,
      isCustom: !!this.customThemes[key]
    }));
  }

  /**
   * Create custom theme
   */
  async createCustomTheme(name, baseTheme, overrides) {
    const base = this.themes[baseTheme] || this.themes.default;
    const customTheme = {
      ...base,
      name,
      description: `Custom theme based on ${base.name}`,
      colors: { ...base.colors, ...overrides.colors },
      icons: { ...base.icons, ...overrides.icons }
    };
    
    this.customThemes[name] = customTheme;
    await this.saveConfig();
    return customTheme;
  }

  /**
   * Animation helpers
   */
  getSpinner(text = 'Loading') {
    const theme = this.getTheme();
    const spinnerFrames = this.animations.enabled ? 
      ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] :
      [theme.icons.loading];
      
    return {
      frames: spinnerFrames,
      text: theme.colors.primary(text),
      color: 'cyan',
      interval: this.animations.speed === 'fast' ? 50 : 
                this.animations.speed === 'slow' ? 150 : 80
    };
  }

  /**
   * Typography helpers
   */
  typography = {
    h1: (text) => {
      const theme = this.getTheme();
      const line = '═'.repeat(text.length + 4);
      return `\n${theme.colors.primary(line)}\n${theme.colors.primary.bold(`  ${text}  `)}\n${theme.colors.primary(line)}\n`;
    },
    
    h2: (text) => {
      const theme = this.getTheme();
      return `\n${theme.colors.secondary.bold(`▶ ${text}`)}\n${theme.colors.dim('─'.repeat(text.length + 2))}\n`;
    },
    
    h3: (text) => {
      const theme = this.getTheme();
      return `\n${theme.colors.accent(`● ${text}`)}\n`;
    },
    
    list: (items, ordered = false) => {
      const theme = this.getTheme();
      return items.map((item, index) => {
        const bullet = ordered ? 
          theme.colors.dim(`${index + 1}.`) : 
          theme.colors.dim(theme.icons.bullet);
        return `  ${bullet} ${item}`;
      }).join('\n');
    },
    
    quote: (text) => {
      const theme = this.getTheme();
      const lines = text.split('\n');
      return lines.map(line => theme.colors.dim('▎ ') + theme.colors.muted(line)).join('\n');
    }
  };
}

module.exports = ThemeManager;
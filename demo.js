#!/usr/bin/env node

// Demo script to showcase the enhanced UI features
const ThemeManager = require('./lib/theme-manager');
const UIUtils = require('./lib/ui-utils');

async function runDemo() {
  const themeManager = new ThemeManager();
  await themeManager.initialize();
  const ui = new UIUtils(themeManager);
  
  console.log('\n🎨 Claude Prompt Enhancer - UI Enhancement Demo\n');
  
  // Show banner
  await ui.showBanner('Claude AI', 'Small');
  
  // Demo different themes
  const themes = ['default', 'darkMode', 'neon', 'minimal', 'forest'];
  
  for (const themeName of themes) {
    await themeManager.setTheme(themeName);
    const theme = themeManager.getTheme();
    
    console.log(theme.typography.h2(`Theme: ${themeName}`));
    
    // Show theme colors
    console.log(theme.success('Success message'));
    console.log(theme.error('Error message'));
    console.log(theme.warning('Warning message'));
    console.log(theme.info('Info message'));
    console.log(theme.enhance('Enhanced prompt'));
    
    // Show a box
    console.log(theme.box('This is a boxed content example\nwith multiple lines', 'Sample Box'));
    
    // Show progress bar
    console.log('\nProgress Bar:');
    for (let i = 0; i <= 10; i++) {
      process.stdout.write('\r' + theme.progressBar(i, 10, 30));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('\n');
    
    // Show notification
    ui.showNotification(`${themeName} theme activated!`, 'success');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Demo animations
  console.log('\n' + themeManager.getTheme().typography.h1('Animation Demos'));
  
  // Spinner styles
  const spinnerStyles = ['default', 'dots', 'pulse', 'wave', 'bounce'];
  
  for (const style of spinnerStyles) {
    const spinner = ui.createSpinner(`Testing ${style} spinner...`, style);
    spinner.start();
    await new Promise(resolve => setTimeout(resolve, 2000));
    spinner.succeed(`${style} spinner complete!`);
  }
  
  // Type text animation
  await ui.typeText('This text appears with a typewriter effect...', 30);
  
  // Show table
  const theme = themeManager.getTheme();
  console.log(theme.typography.h2('Enhanced Prompt Modes'));
  
  const table = ui.createTable(
    ['Mode', 'Type', 'Description'],
    [
      ['Balanced+', 'ML-Enhanced', 'Context-aware optimization'],
      ['Smart Code', 'ML-Enhanced', 'Intelligent code generation'],
      ['Adaptive Think', 'ML-Enhanced', 'Self-adjusting reasoning'],
      ['Creative Boost', 'ML-Enhanced', 'Structured innovation']
    ],
    'fancy'
  );
  
  console.log(table);
  
  // Final message
  await ui.transition('slide');
  ui.showNotification('Demo complete! Try "enhance -i" for the full experience', 'success', {
    borderStyle: 'double',
    padding: 2
  });
}

// Run the demo
runDemo().catch(console.error);
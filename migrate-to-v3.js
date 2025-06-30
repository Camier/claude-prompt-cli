#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

/**
 * Migration script from v2 to v3
 * Preserves user data and settings
 */
async function migrate() {
  console.log(chalk.cyan.bold('\n🔄 Migrating Claude Prompt Enhancer to v3.0\n'));
  
  try {
    // 1. Backup existing configuration
    console.log('1. Backing up existing configuration...');
    const backupDir = path.join(process.cwd(), 'backup-v2');
    await fs.mkdir(backupDir, { recursive: true });
    
    // Backup files
    const filesToBackup = [
      'cli.js',
      'package.json',
      '.env',
      'lib/ai-enhancer.js'
    ];
    
    for (const file of filesToBackup) {
      try {
        await fs.copyFile(file, path.join(backupDir, file));
        console.log(chalk.green(`  ✓ Backed up ${file}`));
      } catch (error) {
        console.log(chalk.yellow(`  ⚠ Could not backup ${file}`));
      }
    }
    
    // 2. Update package.json
    console.log('\n2. Updating package.json...');
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const oldVersion = packageJson.version;
    
    // Update version and dependencies
    packageJson.version = '3.0.0';
    packageJson.dependencies = {
      ...packageJson.dependencies,
      'better-sqlite3': '^9.2.2',
      'ora': '^5.4.1',
      'inquirer': '^8.2.6',
      'yaml': '^2.3.4'
    };
    
    await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    console.log(chalk.green(`  ✓ Updated from v${oldVersion} to v3.0.0`));
    
    // 3. Install v3 files
    console.log('\n3. Installing v3 components...');
    
    // The actual v3 files should already be in place
    // Just verify they exist
    const v3Files = [
      'cli-v3.js',
      'lib/providers/base-provider.js',
      'lib/providers/ollama.js',
      'lib/providers/huggingface.js',
      'lib/providers/registry.js',
      'lib/conversation-history.js',
      'lib/test-runner.js',
      'lib/prompt-builder.js',
      'lib/analytics-dashboard.js'
    ];
    
    let allFilesPresent = true;
    for (const file of v3Files) {
      try {
        await fs.access(file);
        console.log(chalk.green(`  ✓ ${file}`));
      } catch (error) {
        console.log(chalk.red(`  ✗ Missing: ${file}`));
        allFilesPresent = false;
      }
    }
    
    if (!allFilesPresent) {
      console.log(chalk.red('\n❌ Some v3 files are missing. Please ensure all files are copied.'));
      process.exit(1);
    }
    
    // 4. Create migration config
    console.log('\n4. Creating migration configuration...');
    const migrationConfig = {
      migratedAt: new Date().toISOString(),
      fromVersion: oldVersion,
      toVersion: '3.0.0',
      backupLocation: backupDir
    };
    
    await fs.writeFile('.migration-v3.json', JSON.stringify(migrationConfig, null, 2));
    console.log(chalk.green('  ✓ Migration config saved'));
    
    // 5. Update CLI entry point
    console.log('\n5. Updating CLI entry point...');
    await fs.rename('cli.js', 'cli-v2.js');
    await fs.rename('cli-v3.js', 'cli.js');
    console.log(chalk.green('  ✓ CLI updated to v3'));
    
    // 6. Migrate cache if exists
    console.log('\n6. Checking for existing cache...');
    const cacheDir = path.join(require('os').homedir(), '.cache', 'claude-enhancer');
    try {
      await fs.access(cacheDir);
      console.log(chalk.green('  ✓ Cache directory found and will be preserved'));
    } catch (error) {
      console.log(chalk.gray('  ℹ No existing cache found'));
    }
    
    // Success message
    console.log(chalk.green.bold('\n✅ Migration completed successfully!\n'));
    
    console.log(chalk.cyan('Next steps:'));
    console.log('1. Run: npm install');
    console.log('2. Test the new version: enhance --check-health');
    console.log('3. Try Ollama: enhance "test prompt" -p ollama');
    console.log('\nYour v2 files are backed up in:', chalk.yellow(backupDir));
    
    // Show new features
    console.log(chalk.cyan.bold('\n🎉 New features in v3.0:'));
    console.log('- Local LLM support via Ollama');
    console.log('- Multi-provider support (Ollama, HuggingFace, OpenAI, etc.)');
    console.log('- Conversation history with SQLite');
    console.log('- Test-driven prompt development');
    console.log('- Advanced frameworks (SPEAR, COAST, RTF)');
    console.log('- Interactive prompt builder');
    console.log('- Analytics dashboard');
    console.log('\nRun "enhance --help" to see all new options!');
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Migration failed: ${error.message}`));
    console.log('\nPlease check the error and try again.');
    process.exit(1);
  }
}

// Run migration
migrate();
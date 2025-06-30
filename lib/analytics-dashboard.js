const chalk = require('chalk');
// Optional dependencies for full dashboard
let blessed, contrib;
try {
  blessed = require('blessed');
  contrib = require('blessed-contrib');
} catch (e) {
  // Dashboard dependencies not installed
}

/**
 * Analytics Dashboard
 * Real-time visualization of prompt usage and performance
 */
class AnalyticsDashboard {
  constructor(history, registry) {
    this.history = history;
    this.registry = registry;
    this.screen = null;
    this.grid = null;
    this.widgets = {};
    this.updateInterval = null;
  }

  /**
   * Launch the dashboard
   */
  async launch() {
    // Create screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Claude Prompt Enhancer - Analytics Dashboard'
    });

    // Create grid layout
    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen
    });

    // Create widgets
    this.createWidgets();
    
    // Load initial data
    await this.updateData();
    
    // Set up auto-refresh
    this.updateInterval = setInterval(() => {
      this.updateData().catch(console.error);
    }, 5000); // Update every 5 seconds

    // Key bindings
    this.screen.key(['escape', 'q', 'C-c'], () => {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      return process.exit(0);
    });

    // Render
    this.screen.render();
  }

  /**
   * Create dashboard widgets
   */
  createWidgets() {
    // Title
    this.widgets.title = this.grid.set(0, 0, 1, 12, blessed.box, {
      content: ' 📊 Claude Prompt Enhancer Analytics Dashboard ',
      align: 'center',
      style: {
        fg: 'cyan',
        bold: true
      }
    });

    // Usage over time (line chart)
    this.widgets.usageChart = this.grid.set(1, 0, 4, 8, contrib.line, {
      label: ' Usage Over Time ',
      showLegend: true,
      xLabelPadding: 3,
      xPadding: 5,
      wholeNumbersOnly: true,
      style: {
        line: 'cyan',
        text: 'white',
        baseline: 'black'
      }
    });

    // Provider distribution (donut)
    this.widgets.providerDonut = this.grid.set(1, 8, 4, 4, contrib.donut, {
      label: ' Provider Usage ',
      radius: 8,
      arcWidth: 3,
      remainColor: 'black',
      yPadding: 2
    });

    // Mode distribution (bar chart)
    this.widgets.modeBar = this.grid.set(5, 0, 3, 6, contrib.bar, {
      label: ' Enhancement Modes ',
      barWidth: 4,
      barSpacing: 6,
      xOffset: 0,
      maxHeight: 10
    });

    // Response times (gauge)
    this.widgets.responseGauge = this.grid.set(5, 6, 3, 3, contrib.gauge, {
      label: ' Avg Response Time ',
      stroke: 'cyan',
      fill: 'white',
      percent: 0
    });

    // Token usage (gauge)
    this.widgets.tokenGauge = this.grid.set(5, 9, 3, 3, contrib.gauge, {
      label: ' Token Usage ',
      stroke: 'green',
      fill: 'white',
      percent: 0
    });

    // Recent interactions (log)
    this.widgets.recentLog = this.grid.set(8, 0, 4, 6, contrib.log, {
      label: ' Recent Interactions ',
      fg: 'green',
      selectedFg: 'green',
      bufferLength: 50
    });

    // Statistics table
    this.widgets.statsTable = this.grid.set(8, 6, 4, 6, contrib.table, {
      label: ' Statistics ',
      keys: true,
      fg: 'white',
      selectedFg: 'white',
      selectedBg: 'blue',
      interactive: false,
      columnSpacing: 3,
      columnWidth: [20, 15]
    });

    // Help text
    this.screen.append(blessed.box({
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      content: ' Press Q or ESC to exit | Auto-refreshes every 5 seconds ',
      style: {
        fg: 'white',
        bg: 'blue'
      }
    }));
  }

  /**
   * Update dashboard data
   */
  async updateData() {
    try {
      // Get history stats
      const stats = await this.history.getStats();
      const recent = await this.history.getRecent(20);
      
      // Get provider stats
      const providerStats = this.registry.getUsageStats();
      
      // Update usage chart
      await this.updateUsageChart(recent);
      
      // Update provider donut
      this.updateProviderDonut(providerStats);
      
      // Update mode bar chart
      this.updateModeBar(stats.modeBreakdown);
      
      // Update response time gauge
      this.updateResponseGauge(recent);
      
      // Update token gauge
      this.updateTokenGauge(providerStats);
      
      // Update recent log
      this.updateRecentLog(recent);
      
      // Update stats table
      this.updateStatsTable(stats, providerStats);
      
      // Render
      this.screen.render();
    } catch (error) {
      this.widgets.recentLog.log(`Error: ${error.message}`);
    }
  }

  /**
   * Update usage chart
   */
  async updateUsageChart(interactions) {
    // Group by hour
    const hourlyData = {};
    const now = new Date();
    
    // Initialize last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now - i * 60 * 60 * 1000);
      const key = hour.getHours();
      hourlyData[key] = 0;
    }
    
    // Count interactions per hour
    interactions.forEach(interaction => {
      const hour = new Date(interaction.timestamp).getHours();
      if (hourlyData[hour] !== undefined) {
        hourlyData[hour]++;
      }
    });
    
    // Format for chart
    const x = Object.keys(hourlyData).map(h => `${h}:00`);
    const y = Object.values(hourlyData);
    
    this.widgets.usageChart.setData([
      {
        title: 'Prompts/Hour',
        x: x,
        y: y,
        style: { line: 'cyan' }
      }
    ]);
  }

  /**
   * Update provider donut
   */
  updateProviderDonut(providerStats) {
    const data = [];
    let total = 0;
    
    for (const [provider, stats] of Object.entries(providerStats)) {
      total += stats.requests || 0;
      data.push({
        label: provider,
        percent: stats.requests || 0
      });
    }
    
    // Calculate percentages
    if (total > 0) {
      data.forEach(item => {
        item.percent = Math.round((item.percent / total) * 100);
      });
    }
    
    // Set colors
    const colors = ['cyan', 'green', 'yellow', 'blue', 'magenta'];
    data.forEach((item, i) => {
      item.color = colors[i % colors.length];
    });
    
    this.widgets.providerDonut.setData(data);
  }

  /**
   * Update mode bar chart
   */
  updateModeBar(modeBreakdown) {
    const titles = [];
    const data = [];
    
    for (const [mode, count] of Object.entries(modeBreakdown)) {
      titles.push(mode.substring(0, 8)); // Truncate long names
      data.push(count);
    }
    
    this.widgets.modeBar.setData({
      titles: titles,
      data: data
    });
  }

  /**
   * Update response time gauge
   */
  updateResponseGauge(interactions) {
    let totalTime = 0;
    let count = 0;
    
    interactions.forEach(interaction => {
      if (interaction.response_time) {
        totalTime += interaction.response_time;
        count++;
      }
    });
    
    const avgTime = count > 0 ? totalTime / count : 0;
    const percent = Math.min(100, (avgTime / 5000) * 100); // 5s = 100%
    
    this.widgets.responseGauge.setPercent(percent);
    this.widgets.responseGauge.setLabel(` Avg Response: ${avgTime.toFixed(0)}ms `);
  }

  /**
   * Update token gauge
   */
  updateTokenGauge(providerStats) {
    let totalTokens = 0;
    let totalLimit = 0;
    
    for (const [provider, stats] of Object.entries(providerStats)) {
      totalTokens += stats.tokens || 0;
      if (stats.rateLimits) {
        totalLimit += stats.rateLimits.tokensPerMinute || 10000;
      }
    }
    
    const percent = totalLimit > 0 ? Math.min(100, (totalTokens / totalLimit) * 100) : 0;
    
    this.widgets.tokenGauge.setPercent(percent);
    this.widgets.tokenGauge.setLabel(` Tokens: ${totalTokens} `);
  }

  /**
   * Update recent log
   */
  updateRecentLog(interactions) {
    // Clear existing
    this.widgets.recentLog.logLines = [];
    
    // Add recent interactions
    interactions.slice(0, 10).forEach(interaction => {
      const time = new Date(interaction.timestamp).toLocaleTimeString();
      const mode = interaction.mode || 'unknown';
      const provider = interaction.provider || 'template';
      const preview = interaction.prompt.substring(0, 30) + '...';
      
      this.widgets.recentLog.log(
        `[${time}] ${mode}/${provider}: ${preview}`
      );
    });
  }

  /**
   * Update statistics table
   */
  updateStatsTable(historyStats, providerStats) {
    const data = [];
    
    // History stats
    data.push(['Total Prompts', historyStats.total.toString()]);
    data.push(['Unique Prompts', historyStats.unique.toString()]);
    data.push(['Most Used Mode', historyStats.mostUsedMode]);
    
    // Provider stats
    let totalRequests = 0;
    let totalCache = 0;
    
    for (const [provider, stats] of Object.entries(providerStats)) {
      totalRequests += stats.requests || 0;
      if (stats.cache) {
        totalCache += stats.cache.size || 0;
      }
    }
    
    data.push(['API Requests', totalRequests.toString()]);
    data.push(['Cached Items', totalCache.toString()]);
    
    // Active providers
    const activeProviders = Object.keys(providerStats).join(', ');
    data.push(['Active Providers', activeProviders]);
    
    this.widgets.statsTable.setData({
      headers: ['Metric', 'Value'],
      data: data
    });
  }

  /**
   * Create a simple text-based dashboard (fallback)
   */
  async showTextDashboard() {
    console.clear();
    console.log(chalk.cyan.bold('\n📊 Claude Prompt Enhancer - Analytics Report\n'));
    
    // Get data
    const stats = await this.history.getStats();
    const recent = await this.history.getRecent(10);
    const providerStats = this.registry.getUsageStats();
    const health = await this.registry.checkHealth();
    
    // Overall statistics
    console.log(chalk.yellow.bold('📈 Overall Statistics'));
    console.log(`  Total Interactions: ${chalk.green(stats.total)}`);
    console.log(`  Unique Prompts: ${chalk.green(stats.unique)}`);
    console.log(`  Most Used Mode: ${chalk.green(stats.mostUsedMode)}\n`);
    
    // Mode breakdown
    console.log(chalk.yellow.bold('🎯 Mode Usage'));
    for (const [mode, count] of Object.entries(stats.modeBreakdown)) {
      const bar = '█'.repeat(Math.min(30, Math.round(count / stats.total * 100)));
      console.log(`  ${mode.padEnd(12)} ${bar} ${count}`);
    }
    console.log();
    
    // Provider statistics
    console.log(chalk.yellow.bold('🔌 Provider Statistics'));
    for (const [provider, pStats] of Object.entries(providerStats)) {
      console.log(`  ${chalk.cyan(provider)}:`);
      console.log(`    Requests: ${pStats.requests}`);
      console.log(`    Tokens: ${pStats.tokens}`);
      if (pStats.cache) {
        console.log(`    Cache: ${pStats.cache.size} items (${pStats.cache.hitRate} hit rate)`);
      }
      console.log(`    Status: ${health[provider].status === 'healthy' ? chalk.green('✓') : chalk.red('✗')}`);
    }
    console.log();
    
    // Recent activity
    console.log(chalk.yellow.bold('🕐 Recent Activity'));
    recent.slice(0, 5).forEach((interaction, i) => {
      const time = new Date(interaction.timestamp).toLocaleString();
      const preview = interaction.prompt.substring(0, 50) + '...';
      console.log(`  ${i + 1}. [${time}] ${interaction.mode} - ${preview}`);
    });
    console.log();
    
    // Performance metrics
    console.log(chalk.yellow.bold('⚡ Performance Metrics'));
    let totalResponseTime = 0;
    let responseCount = 0;
    
    recent.forEach(interaction => {
      if (interaction.response_time) {
        totalResponseTime += interaction.response_time;
        responseCount++;
      }
    });
    
    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
    console.log(`  Average Response Time: ${chalk.green(avgResponseTime.toFixed(0) + 'ms')}`);
    
    // Cost estimation (if applicable)
    let estimatedCost = 0;
    for (const [provider, pStats] of Object.entries(providerStats)) {
      const tokens = pStats.tokens || 0;
      // Rough cost estimates per 1K tokens
      const costs = {
        huggingface: 0.001,
        openai: 0.002,
        anthropic: 0.003
      };
      estimatedCost += (tokens / 1000) * (costs[provider] || 0);
    }
    
    if (estimatedCost > 0) {
      console.log(`  Estimated Cost: ${chalk.green('$' + estimatedCost.toFixed(4))}`);
    }
    
    console.log(chalk.gray('\n  Generated at: ' + new Date().toLocaleString()));
  }
}

// Export a simpler version that doesn't require blessed
class SimpleAnalyticsDashboard {
  constructor(history, registry) {
    this.history = history;
    this.registry = registry;
  }

  async show() {
    const dashboard = new AnalyticsDashboard(this.history, this.registry);
    await dashboard.showTextDashboard();
  }
}

module.exports = { AnalyticsDashboard, SimpleAnalyticsDashboard };
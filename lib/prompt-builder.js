const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

/**
 * Interactive Prompt Builder
 * Helps users construct well-structured prompts step by step
 */
class PromptBuilder {
  constructor() {
    this.templates = {
      task: {
        name: 'Task-Based Prompt',
        description: 'For specific tasks or requests',
        sections: ['context', 'task', 'requirements', 'constraints', 'examples', 'output']
      },
      analysis: {
        name: 'Analysis Prompt',
        description: 'For analytical or research tasks',
        sections: ['background', 'objective', 'scope', 'methodology', 'deliverables']
      },
      creative: {
        name: 'Creative Prompt',
        description: 'For creative writing or ideation',
        sections: ['inspiration', 'style', 'tone', 'constraints', 'audience']
      },
      technical: {
        name: 'Technical Prompt',
        description: 'For coding or technical tasks',
        sections: ['problem', 'requirements', 'constraints', 'technology', 'examples', 'testing']
      },
      learning: {
        name: 'Learning Prompt',
        description: 'For educational content',
        sections: ['topic', 'level', 'objectives', 'format', 'examples']
      }
    };
    
    this.sectionPrompts = {
      // Task sections
      context: 'Provide background context for this task',
      task: 'What specific task should be accomplished?',
      requirements: 'List specific requirements (comma-separated)',
      constraints: 'Any limitations or constraints?',
      examples: 'Provide examples if helpful',
      output: 'Describe the desired output format',
      
      // Analysis sections
      background: 'What is the background/context?',
      objective: 'What is the main objective?',
      scope: 'Define the scope of analysis',
      methodology: 'Preferred approach or methodology?',
      deliverables: 'Expected deliverables',
      
      // Creative sections
      inspiration: 'Source of inspiration or theme',
      style: 'Preferred style (e.g., formal, casual, poetic)',
      tone: 'Desired tone (e.g., serious, humorous, inspiring)',
      audience: 'Target audience',
      
      // Technical sections
      problem: 'Describe the technical problem',
      technology: 'Technologies/languages to use',
      testing: 'Testing requirements',
      
      // Learning sections
      topic: 'What topic to cover?',
      level: 'Skill level (beginner, intermediate, advanced)',
      objectives: 'Learning objectives',
      format: 'Preferred format (tutorial, explanation, exercises)'
    };
    
    this.enhancements = {
      clarity: {
        name: 'Enhance Clarity',
        apply: (prompt) => this.enhanceClarity(prompt)
      },
      specificity: {
        name: 'Add Specificity',
        apply: (prompt) => this.enhanceSpecificity(prompt)
      },
      structure: {
        name: 'Improve Structure',
        apply: (prompt) => this.enhanceStructure(prompt)
      },
      examples: {
        name: 'Add Examples',
        apply: (prompt) => this.addExamples(prompt)
      },
      constraints: {
        name: 'Add Constraints',
        apply: (prompt) => this.addConstraints(prompt)
      }
    };
  }

  /**
   * Build a prompt interactively
   */
  async buildInteractive() {
    console.log(chalk.cyan.bold('\n🏗️  Interactive Prompt Builder\n'));
    
    // Select template
    const { template } = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Select a prompt template:',
        choices: [
          ...Object.entries(this.templates).map(([key, tmpl]) => ({
            name: `${tmpl.name} - ${tmpl.description}`,
            value: key
          })),
          new inquirer.Separator(),
          { name: 'Custom (start from scratch)', value: 'custom' }
        ]
      }
    ]);
    
    let builtPrompt = '';
    
    if (template === 'custom') {
      builtPrompt = await this.buildCustom();
    } else {
      builtPrompt = await this.buildFromTemplate(template);
    }
    
    // Enhancement options
    const { enhance } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enhance',
        message: 'Would you like to enhance this prompt?',
        default: true
      }
    ]);
    
    if (enhance) {
      builtPrompt = await this.enhancePrompt(builtPrompt);
    }
    
    // Review and finalize
    console.log(chalk.green.bold('\n✨ Built Prompt:\n'));
    console.log(builtPrompt);
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Use this prompt', value: 'use' },
          { name: 'Save as template', value: 'save' },
          { name: 'Export to file', value: 'export' },
          { name: 'Start over', value: 'restart' }
        ]
      }
    ]);
    
    switch (action) {
      case 'save':
        await this.saveAsTemplate(builtPrompt);
        return builtPrompt;
      case 'export':
        await this.exportPrompt(builtPrompt);
        return builtPrompt;
      case 'restart':
        return this.buildInteractive();
      default:
        return builtPrompt;
    }
  }

  /**
   * Build from template
   */
  async buildFromTemplate(templateKey) {
    const template = this.templates[templateKey];
    const sections = {};
    
    console.log(chalk.yellow(`\nBuilding ${template.name}...\n`));
    
    for (const section of template.sections) {
      const { value } = await inquirer.prompt([
        {
          type: 'input',
          name: 'value',
          message: this.sectionPrompts[section] || `Enter ${section}:`,
          validate: (input) => {
            if (section === 'task' || section === 'problem' || section === 'topic') {
              return input.trim().length > 0 || 'This field is required';
            }
            return true;
          }
        }
      ]);
      
      if (value.trim()) {
        sections[section] = value.trim();
      }
    }
    
    // Format the prompt
    return this.formatPrompt(sections, templateKey);
  }

  /**
   * Build custom prompt
   */
  async buildCustom() {
    const sections = [];
    let addMore = true;
    
    console.log(chalk.yellow('\nBuilding custom prompt...\n'));
    console.log(chalk.gray('Add sections one by one. Leave blank to finish.\n'));
    
    while (addMore) {
      const { sectionType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'sectionType',
          message: 'Add a section:',
          choices: [
            { name: 'Main objective/task', value: 'main' },
            { name: 'Context/Background', value: 'context' },
            { name: 'Requirements', value: 'requirements' },
            { name: 'Examples', value: 'examples' },
            { name: 'Constraints', value: 'constraints' },
            { name: 'Expected output', value: 'output' },
            { name: 'Custom section', value: 'custom' },
            new inquirer.Separator(),
            { name: 'Finish building', value: 'done' }
          ]
        }
      ]);
      
      if (sectionType === 'done') {
        addMore = false;
        continue;
      }
      
      let sectionName = sectionType;
      if (sectionType === 'custom') {
        const { name } = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Section name:'
          }
        ]);
        sectionName = name;
      }
      
      const { content } = await inquirer.prompt([
        {
          type: 'editor',
          name: 'content',
          message: `Enter content for "${sectionName}":`
        }
      ]);
      
      if (content.trim()) {
        sections.push({
          name: sectionName,
          content: content.trim()
        });
      }
    }
    
    // Format custom sections
    let prompt = '';
    for (const section of sections) {
      if (section.name === 'main') {
        prompt = section.content + '\n\n' + prompt;
      } else {
        prompt += `${this.formatSectionName(section.name)}:\n${section.content}\n\n`;
      }
    }
    
    return prompt.trim();
  }

  /**
   * Format prompt from sections
   */
  formatPrompt(sections, templateKey) {
    let prompt = '';
    
    // Special handling for different templates
    switch (templateKey) {
      case 'task':
        if (sections.context) {
          prompt += `Context:\n${sections.context}\n\n`;
        }
        prompt += `Task:\n${sections.task}\n\n`;
        if (sections.requirements) {
          prompt += `Requirements:\n${this.formatList(sections.requirements)}\n\n`;
        }
        if (sections.constraints) {
          prompt += `Constraints:\n${sections.constraints}\n\n`;
        }
        if (sections.examples) {
          prompt += `Examples:\n${sections.examples}\n\n`;
        }
        if (sections.output) {
          prompt += `Expected Output:\n${sections.output}`;
        }
        break;
        
      case 'analysis':
        if (sections.background) {
          prompt += `Background:\n${sections.background}\n\n`;
        }
        prompt += `Objective:\n${sections.objective}\n\n`;
        if (sections.scope) {
          prompt += `Scope:\n${sections.scope}\n\n`;
        }
        if (sections.methodology) {
          prompt += `Methodology:\n${sections.methodology}\n\n`;
        }
        if (sections.deliverables) {
          prompt += `Deliverables:\n${this.formatList(sections.deliverables)}`;
        }
        break;
        
      case 'creative':
        prompt += sections.inspiration + '\n\n';
        if (sections.style) {
          prompt += `Style: ${sections.style}\n`;
        }
        if (sections.tone) {
          prompt += `Tone: ${sections.tone}\n`;
        }
        if (sections.audience) {
          prompt += `Audience: ${sections.audience}\n`;
        }
        if (sections.constraints) {
          prompt += `\nConstraints:\n${sections.constraints}`;
        }
        break;
        
      case 'technical':
        prompt += `Problem:\n${sections.problem}\n\n`;
        if (sections.requirements) {
          prompt += `Requirements:\n${this.formatList(sections.requirements)}\n\n`;
        }
        if (sections.technology) {
          prompt += `Technology Stack: ${sections.technology}\n\n`;
        }
        if (sections.constraints) {
          prompt += `Constraints:\n${sections.constraints}\n\n`;
        }
        if (sections.examples) {
          prompt += `Examples:\n${sections.examples}\n\n`;
        }
        if (sections.testing) {
          prompt += `Testing Requirements:\n${sections.testing}`;
        }
        break;
        
      case 'learning':
        prompt += `Topic: ${sections.topic}\n`;
        prompt += `Level: ${sections.level}\n\n`;
        if (sections.objectives) {
          prompt += `Learning Objectives:\n${this.formatList(sections.objectives)}\n\n`;
        }
        if (sections.format) {
          prompt += `Format: ${sections.format}\n`;
        }
        if (sections.examples) {
          prompt += `\nInclude Examples: ${sections.examples}`;
        }
        break;
    }
    
    return prompt.trim();
  }

  /**
   * Enhance prompt interactively
   */
  async enhancePrompt(prompt) {
    const { enhancements } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'enhancements',
        message: 'Select enhancements to apply:',
        choices: Object.entries(this.enhancements).map(([key, enh]) => ({
          name: enh.name,
          value: key,
          checked: key === 'clarity' || key === 'structure'
        }))
      }
    ]);
    
    let enhanced = prompt;
    
    for (const enhancement of enhancements) {
      enhanced = await this.enhancements[enhancement].apply(enhanced);
    }
    
    return enhanced;
  }

  /**
   * Enhancement methods
   */
  async enhanceClarity(prompt) {
    // Add clarity markers
    return prompt
      .replace(/should/g, 'must')
      .replace(/maybe/g, 'specifically')
      .replace(/some/g, 'the following')
      .replace(/things/g, 'items');
  }

  async enhanceSpecificity(prompt) {
    const { additions } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'additions',
        message: 'Add specific details:',
        choices: [
          { name: 'Exact format requirements', value: 'format' },
          { name: 'Length/size constraints', value: 'length' },
          { name: 'Quality criteria', value: 'quality' },
          { name: 'Timeline/deadline', value: 'timeline' },
          { name: 'Success metrics', value: 'metrics' }
        ]
      }
    ]);
    
    let enhanced = prompt;
    
    for (const addition of additions) {
      switch (addition) {
        case 'format':
          enhanced += '\n\nFormat: Provide response in structured sections with clear headers.';
          break;
        case 'length':
          const { length } = await inquirer.prompt([
            {
              type: 'input',
              name: 'length',
              message: 'Specify length requirement:',
              default: '200-500 words'
            }
          ]);
          enhanced += `\n\nLength: ${length}`;
          break;
        case 'quality':
          enhanced += '\n\nQuality Criteria:\n- Comprehensive coverage\n- Clear explanations\n- Practical examples\n- Actionable insights';
          break;
        case 'timeline':
          enhanced += '\n\nPriority: High - Need immediate response';
          break;
        case 'metrics':
          enhanced += '\n\nSuccess Metrics:\n- Completeness of response\n- Clarity of explanation\n- Practical applicability';
          break;
      }
    }
    
    return enhanced;
  }

  async enhanceStructure(prompt) {
    // Ensure proper structure
    const lines = prompt.split('\n');
    const structured = [];
    let currentSection = null;
    
    for (const line of lines) {
      if (line.includes(':') && line.indexOf(':') < 20) {
        // This looks like a section header
        currentSection = line;
        structured.push('\n' + line);
      } else if (line.trim()) {
        structured.push(line);
      }
    }
    
    return structured.join('\n').trim();
  }

  async addExamples(prompt) {
    const { wantExamples } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'wantExamples',
        message: 'Would you like to add examples?',
        default: true
      }
    ]);
    
    if (!wantExamples) return prompt;
    
    const { examples } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'examples',
        message: 'Enter examples (one per line):'
      }
    ]);
    
    if (examples.trim()) {
      return prompt + '\n\nExamples:\n' + examples.trim();
    }
    
    return prompt;
  }

  async addConstraints(prompt) {
    const { constraints } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'constraints',
        message: 'Add constraints:',
        choices: [
          { name: 'No external dependencies', value: 'no-deps' },
          { name: 'Must be beginner-friendly', value: 'beginner' },
          { name: 'Performance optimized', value: 'performance' },
          { name: 'Security considerations', value: 'security' },
          { name: 'Cross-platform compatible', value: 'cross-platform' },
          { name: 'Custom constraint', value: 'custom' }
        ]
      }
    ]);
    
    if (constraints.length === 0) return prompt;
    
    let constraintText = '\n\nConstraints:';
    
    for (const constraint of constraints) {
      switch (constraint) {
        case 'no-deps':
          constraintText += '\n- No external dependencies or libraries';
          break;
        case 'beginner':
          constraintText += '\n- Must be understandable by beginners';
          break;
        case 'performance':
          constraintText += '\n- Optimize for performance and efficiency';
          break;
        case 'security':
          constraintText += '\n- Include security best practices';
          break;
        case 'cross-platform':
          constraintText += '\n- Ensure cross-platform compatibility';
          break;
        case 'custom':
          const { custom } = await inquirer.prompt([
            {
              type: 'input',
              name: 'custom',
              message: 'Enter custom constraint:'
            }
          ]);
          if (custom) {
            constraintText += `\n- ${custom}`;
          }
          break;
      }
    }
    
    return prompt + constraintText;
  }

  /**
   * Format section name
   */
  formatSectionName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Format comma-separated list
   */
  formatList(text) {
    if (text.includes(',')) {
      return text.split(',').map(item => `- ${item.trim()}`).join('\n');
    }
    return text;
  }

  /**
   * Save as template
   */
  async saveAsTemplate(prompt) {
    const { name, description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Template name:',
        validate: input => input.trim().length > 0 || 'Name is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Template description:'
      }
    ]);
    
    const templateDir = path.join(os.homedir(), '.cache', 'claude-enhancer', 'templates');
    await fs.mkdir(templateDir, { recursive: true });
    
    const template = {
      name,
      description,
      prompt,
      created: new Date().toISOString()
    };
    
    const filename = path.join(templateDir, `${name.replace(/\s+/g, '-').toLowerCase()}.json`);
    await fs.writeFile(filename, JSON.stringify(template, null, 2));
    
    console.log(chalk.green(`✅ Template saved: ${filename}`));
  }

  /**
   * Export prompt
   */
  async exportPrompt(prompt) {
    const { filename } = await inquirer.prompt([
      {
        type: 'input',
        name: 'filename',
        message: 'Export filename:',
        default: `prompt-${Date.now()}.txt`
      }
    ]);
    
    await fs.writeFile(filename, prompt);
    console.log(chalk.green(`✅ Exported to: ${filename}`));
  }

  /**
   * Load user templates
   */
  async loadUserTemplates() {
    const templateDir = path.join(os.homedir(), '.cache', 'claude-enhancer', 'templates');
    
    try {
      const files = await fs.readdir(templateDir);
      const templates = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(templateDir, file), 'utf8');
          templates.push(JSON.parse(content));
        }
      }
      
      return templates;
    } catch (error) {
      return [];
    }
  }
}

module.exports = PromptBuilder;
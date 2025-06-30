# 🧠 Claude Prompt Enhancer CLI v3.0

A powerful command-line tool for enhancing prompts with multiple LLM providers, advanced frameworks, and comprehensive analytics. **Now with local LLM support via Ollama!**

## 🚀 What's New in v3.0

- 🦙 **Local LLM Support**: Run models locally with Ollama - no API keys needed!
- 🔌 **Multi-Provider System**: Seamlessly switch between Ollama, HuggingFace, OpenAI, and more
- 💾 **Conversation History**: SQLite-powered history with search and context management
- 🧪 **Test-Driven Prompts**: Write tests for your prompts to ensure quality
- 🏗️ **Interactive Builder**: Build perfect prompts step-by-step with guided workflows
- 📊 **Analytics Dashboard**: Real-time insights into usage, performance, and costs
- 🎯 **Advanced Frameworks**: SPEAR, COAST, RTF frameworks for structured prompting
- 🔄 **Smart Fallbacks**: Automatic provider failover for maximum reliability

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/claude-prompt-enhancer.git
cd claude-prompt-enhancer

# Install dependencies
npm install

# Link globally
npm link

# Migrate from v2 (if applicable)
node migrate-to-v3.js
```

## 🦙 Ollama Setup (Recommended)

Local LLMs provide privacy, no rate limits, and zero API costs!

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service
ollama serve

# Pull recommended models (choose based on your needs)
ollama pull llama3.2:1b    # Fastest, good for quick tasks (1.3GB)
ollama pull codellama      # Best for coding tasks (3.8GB)
ollama pull mistral        # Great quality/speed balance (4.1GB)
ollama pull neural-chat    # Best for creative tasks (3.8GB)

# Test with enhance
enhance "explain quantum computing" -p ollama
```

## 🤖 Provider Configuration

### Local Providers (No API Key Required)

```bash
# Ollama (default)
enhance "your prompt" -p ollama

# Ollama with specific model
enhance "write code" -p ollama --model codellama
```

### Cloud Providers

```bash
# Copy example environment file
cp env.example .env

# Edit .env and add your API keys
# HF_TOKEN=hf_xxxxx              # HuggingFace
# OPENAI_API_KEY=sk-xxxxx        # OpenAI (coming soon)
# ANTHROPIC_API_KEY=sk-ant-xxxxx # Anthropic (coming soon)
```

## 📖 Usage Examples

### Basic Usage

```bash
# Simple enhancement with local LLM
enhance "explain how neural networks work"

# Use specific provider
enhance "create a REST API" -p huggingface

# Use specific mode
enhance "analyze market trends" -m analysis

# Use advanced framework
enhance "implement auth system" --framework SPEAR

# Interactive mode with guided prompts
enhance -i

# Continue from last conversation
enhance --continue
```

### Advanced Features

```bash
# Run prompt tests
enhance --test examples/tests/basic-tests.yaml

# Compare providers
enhance "solve this problem" --compare

# View analytics dashboard
enhance dashboard

# Build prompt interactively
enhance --build

# Stream responses in real-time
enhance "tell me a story" --stream

# Show conversation history
enhance --history

# Check provider health
enhance --check-health
```

## 🎯 Enhancement Modes & Frameworks

### Standard Modes

| Mode | Description | Best For |
|------|-------------|----------|
| **balanced** | Clear, structured prompts | General use |
| **ultrathink** | Deep reasoning with metacognition | Complex problems |
| **coding** | Optimized for programming | Code generation |
| **analysis** | Systematic analysis | Research & data |
| **creative** | Enhanced creativity | Writing & art |

### Advanced Frameworks

| Framework | Description | Components |
|-----------|-------------|------------|
| **SPEAR** | Start, Provide, Explain, Ask, Repeat | Structured problem-solving |
| **COAST** | Challenge, Objective, Actions, Strategy, Tactics | Strategic planning |
| **RTF** | Role, Task, Format | Clear task definition |

## 🧪 Test-Driven Prompt Development

Create reliable, consistent prompts with testing:

```yaml
# prompt-tests.yaml
tests:
  - name: "API Documentation Test"
    mode: coding
    prompt: "document a REST API endpoint"
    assertions:
      - contains: "endpoint"
      - contains: "parameters"
      - contains: "response"
      - has_sections: ["Description", "Parameters", "Response"]
      - quality: structured
```

Run tests:
```bash
enhance --test prompt-tests.yaml
```

## 📊 Analytics & Insights

### View Statistics
```bash
enhance --stats

# Output:
📊 Usage Statistics

ollama:
  Requests: 156
  Tokens: 45,231
  Models: 4 available

huggingface:
  Requests: 89
  Tokens: 23,456
  Cache: 78 entries, 65% hit rate

Conversation History:
  Total interactions: 245
  Unique prompts: 187
  Most used mode: coding
```

### Analytics Dashboard
```bash
enhance dashboard

# Opens interactive dashboard with:
# - Usage graphs over time
# - Provider distribution
# - Response time metrics
# - Token usage tracking
# - Cost estimation
```

## 🏗️ Interactive Prompt Builder

Build perfect prompts step-by-step:

```bash
enhance --build

# Guided workflow:
1. Select template (Task, Analysis, Creative, Technical, Custom)
2. Fill in sections with prompts
3. Apply enhancements (clarity, specificity, examples)
4. Preview and test
5. Save as template for reuse
```

## 💾 Conversation Management

### History Features
```bash
# View recent interactions
enhance --history

# Search past prompts
enhance search "authentication"

# Export conversation history
enhance export history.json

# Clear history
enhance --clear-cache
```

### Session Management
```bash
# Start a new session
enhance session start "Project Planning"

# Continue in session context
enhance "break this down into tasks" --session

# View session interactions
enhance session view
```

## 🔌 Multi-Provider Features

### Automatic Failover
```bash
# If primary provider fails, automatically tries others
enhance "complex task" -p openai
# Falls back to: ollama → huggingface → templates
```

### Provider Comparison
```bash
# Compare output across all providers
enhance "explain recursion" --compare

# Output shows:
# - Response quality
# - Response time
# - Token usage
# - Cost (if applicable)
```

## 🛠️ Configuration

### Environment Variables
```bash
# Provider defaults
DEFAULT_PROVIDER=ollama
DEFAULT_MODE=balanced

# Ollama settings
OLLAMA_BASE_URL=http://localhost:11434

# Performance
MAX_PROMPT_LENGTH=50000
REQUEST_TIMEOUT=120000

# Features
ENABLE_TELEMETRY=false
ENABLE_PLUGINS=true
```

### Custom Templates

Create your own enhancement templates:

```javascript
// templates/my-template.js
module.exports = {
  name: 'My Custom Template',
  description: 'Specialized for my use case',
  enhance: (input) => `
    Context: ${input}
    
    Requirements:
    - Be specific and actionable
    - Include examples
    - Consider edge cases
    
    Format: Structured with clear sections
  `
};
```

## 🚀 Performance Tips

1. **Use Local Models**: Ollama provides instant responses with no rate limits
2. **Enable Caching**: Responses are cached for 24 hours by default
3. **Batch Operations**: Process multiple prompts efficiently
4. **Choose Right Model**: 
   - `llama3.2:1b` - Fastest, minimal resources
   - `codellama` - Optimized for programming
   - `mistral` - Excellent speed/quality balance
   - `neural-chat` - Excellent for creative writing

## 🔧 Troubleshooting

### Ollama Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# View Ollama logs
journalctl -u ollama

# List installed models
ollama list

# Pull specific model
ollama pull codellama
```

### Provider Issues
```bash
# Check all providers
enhance --check-health

# Test specific provider
enhance "test" -p huggingface --debug

# View detailed logs
VERBOSE_MODE=true enhance "test"
```

## 🤝 Contributing

We welcome contributions! Areas for improvement:

- [ ] Additional providers (OpenAI, Anthropic, Google)
- [ ] Web dashboard interface
- [ ] Plugin system implementation
- [ ] More test assertions
- [ ] Additional frameworks
- [ ] Performance optimizations

## 📈 Roadmap

- **v3.1**: OpenAI and Anthropic provider support
- **v3.2**: Web-based analytics dashboard
- **v3.3**: Plugin marketplace
- **v3.4**: Team collaboration features
- **v4.0**: AI-powered prompt optimization

## 📄 License

MIT License - Use freely!

## 🙏 Acknowledgments

- Ollama team for amazing local LLM support
- HuggingFace for model access
- Commander.js, Inquirer.js, and all dependency maintainers
- The prompt engineering community

---

**Transform your prompts with the power of local and cloud AI! 🚀**
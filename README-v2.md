# 🧠 Claude Prompt Enhancer CLI v2.1

A powerful command-line tool for enhancing prompts using advanced techniques. **Now with AI enhancement support via Hugging Face Pro!**

## ✨ What's New in v2.1

- 🤖 **AI Enhancement**: Use Hugging Face models to intelligently enhance prompts
- 📊 **Usage Tracking**: Monitor your API usage with built-in statistics
- 💾 **Smart Caching**: Reduces API calls by caching similar prompts
- 🚀 **Multiple Models**: Choose between fast, balanced, or deep models
- 🔄 **Hybrid Mode**: Combine template-based and AI enhancement

## 🚀 Features

- 📝 **Rule-based Enhancement**: Works offline with templates (no API needed)
- 🤖 **AI Enhancement**: Optional AI-powered enhancement with HF Pro
- 🎯 **5 Enhancement Modes**: Balanced, UltraThink+, Coding, Analysis, Creative
- 📋 **Clipboard Integration**: Copy enhanced prompts instantly
- 🎨 **Custom Templates**: Create your own enhancement templates
- 🔧 **Flexible Options**: Examples, constraints, XML formatting, and more
- 💡 **Chain-of-Thought**: Built-in reasoning enhancements

## 📦 Installation

```bash
# Navigate to the project directory
cd /mnt/c/Users/micka/Documents/claude-prompt-cli

# Install dependencies
npm install

# Link globally
npm link

# Now you can use it anywhere!
enhance "your prompt here"
```

## 🤖 AI Enhancement Setup (Optional)

### 1. Get HF Pro Account
Sign up for Hugging Face Pro at https://huggingface.co/pricing

### 2. Get Your API Token
1. Go to https://huggingface.co/settings/tokens
2. Create a new token with "read" permissions
3. Copy the token

### 3. Configure Environment
```bash
# Create .env file
cp .env.example .env

# Edit .env and add your token
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Test AI Enhancement
```bash
# Test with AI
enhance "explain quantum computing" --ai

# Check your usage stats
enhance --stats
```

## 📖 Usage

### Basic Usage (Template-Based - Free)
```bash
# Simple enhancement
enhance "explain how neural networks work"

# Use specific mode
enhance "create a todo app" -m coding

# Interactive mode
enhance -i
```

### AI-Enhanced Usage (HF Pro)
```bash
# Basic AI enhancement
enhance "write a parser" --ai

# Use specific AI model
enhance "explain consciousness" -m ultrathink --ai --ai-model deep

# Fast model for quick enhancements
enhance "sort array" -m coding --ai --ai-model fast

# Check usage statistics
enhance --stats

# Clear cache if needed
enhance --clear-cache
```

## 🎯 Enhancement Modes

| Mode | Description | Best For | AI Model |
|------|-------------|----------|----------|
| **balanced** | Clear, structured prompts | General use | Flan-T5 XL |
| **ultrathink** | Deep reasoning with metacognition | Complex problems | Llama 2 70B |
| **coding** | Optimized for programming | Code tasks | Mixtral 8x7B |
| **analysis** | Systematic analysis | Research/data | Mixtral 8x7B |
| **creative** | Enhanced creative tasks | Writing/art | Mixtral 8x7B |

## 🤖 AI Models

| Model Tier | Model | Speed | Quality | Rate Limit |
|------------|-------|-------|---------|------------|
| **fast** | Flan-T5 XL | <1s | Good | ~5000/hr |
| **balanced** | Mixtral 8x7B | 1-2s | Excellent | ~2000/hr |
| **deep** | Llama 2 70B | 3-5s | Best | ~500/hr |

## 🛠️ Advanced Options

```bash
# Combine multiple enhancements
enhance "complex task" -m ultrathink -e --cot --reflect --ai

# Use custom template with AI polish
enhance "my prompt" -t template.txt --ai

# Save to file with XML format
enhance "analyze data" -m analysis --xml -o result.xml --ai

# Pipe from other commands
echo "debug this" | enhance -m coding --ai | pbcopy

# Disable cache for fresh results
enhance "latest news analysis" --ai --no-cache
```

## 📊 Usage Tracking

The tool tracks your API usage to help you stay within limits:

```bash
$ enhance --stats

📊 AI Enhancement Statistics

Daily requests: 147
Hourly requests: 23
Cache size: 89
Cache hit rate: 34%
Last reset: 2024-01-10T15:00:00Z
```

## 💡 Tips & Tricks

### 1. Optimize API Usage
- Use template mode for simple enhancements
- Enable AI only when you need higher quality
- The cache automatically saves repeated prompts

### 2. Model Selection Strategy
- **fast**: Quick iterations, brainstorming
- **balanced**: Most everyday use cases  
- **deep**: Complex reasoning, important prompts

### 3. Create Aliases
```bash
# Add to ~/.bashrc or ~/.zshrc
alias ep='enhance'
alias epai='enhance --ai'
alias epc='enhance -m coding --ai'
alias epu='enhance -m ultrathink --ai --ai-model deep'
alias epstats='enhance --stats'
```

### 4. Batch Processing
```bash
# Process multiple prompts efficiently
for prompt in prompts/*.txt; do
  enhance -f "$prompt" --ai -o "enhanced/$(basename $prompt)"
  sleep 1  # Respect rate limits
done
```

## 🔧 Environment Variables

```bash
# Required for AI features
HF_TOKEN=hf_xxxxx

# Optional configurations
DEFAULT_AI_MODEL=balanced      # Default: balanced
CACHE_DIR=~/.cache/enhancer   # Default: ~/.cache
NO_COLOR=1                    # Disable colors
```

## 🚨 Troubleshooting

### Rate Limit Errors
- The tool automatically retries with exponential backoff
- Check your usage with `enhance --stats`
- Consider using the cache more effectively
- Switch to a smaller model if needed

### API Token Issues
- Ensure your token has "read" permissions
- Check token hasn't expired
- Verify HF Pro subscription is active

### Cache Issues
- Clear cache with `enhance --clear-cache`
- Cache is stored in your home directory
- Each cached entry expires after 24 hours

## 📈 Performance Tips

1. **Start with templates**: Use AI only when needed
2. **Use appropriate models**: Don't use Llama 70B for simple tasks
3. **Leverage caching**: Similar prompts are cached automatically
4. **Monitor usage**: Regular `--stats` checks prevent surprises

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Add new enhancement modes or features
4. Submit a pull request

## 📄 License

MIT License - Use freely!

## 🙏 Credits

- Commander.js for CLI parsing
- Chalk for beautiful terminal output  
- Clipboardy for clipboard integration
- Hugging Face for AI models
- LRU Cache for efficient caching

---

**Enhance your prompts with the power of AI! 🚀**
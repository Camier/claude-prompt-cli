# CLAUDE.md - Claude Code Development Guide

## 🎯 Project Overview

**claude-prompt-cli** - A secure Node.js CLI tool for enhancing prompts with AI-powered and template-based modes. Recently audited and hardened with comprehensive security measures.

### Key Technologies
- **Runtime**: Node.js with Commander.js CLI framework
- **AI Integration**: Hugging Face Inference API with multiple model tiers
- **Caching**: LRU cache with persistent file-based storage (`~/.cache/claude-enhancer/`)
- **Security**: Path traversal protection, input validation, sanitized error handling

### Architecture
```
cli.js (622 lines)           # Main CLI interface and command handling
lib/ai-enhancer.js (608 lines) # AI integration with persistent caching
.env                         # Environment configuration (HF_TOKEN)
templates/                   # Enhancement mode templates
```

## 🏆 Community-Proven Workflows

### Requirements Gathering System (1316 upvotes on r/ClaudeAI)
Use these slash commands in conversations:
```
/req - Initial requirements gathering and scope definition
/requpdate - Update or modify existing requirements
/reqcheck - Review and validate current understanding
/implement - Begin implementation with clear context
/review - Enter code review mode with specific focus
```

### Sprint Planning for Large Features (758 upvotes)
```
Phase 1: Planning & Architecture (Day 1)
- Define clear 2-3 day sprint goals
- Create architectural overview
- Identify dependencies and risks
- Set measurable deliverables

Phase 2: Implementation Sprint (Days 2-3)
- Focus on single feature/module
- Test incrementally as you build
- Document decisions and patterns
- Commit working code frequently

Phase 3: Integration & Polish (Day 4)
- Combine components
- End-to-end testing
- Performance validation
- Security review
```

## 🔒 Security-First Development

### Current Security Measures
This project has been security-audited and implements:

1. **Path Traversal Protection** (cli.js:413-422, 517-524, 543-550)
   - All file paths validated against current working directory
   - Resolved paths checked with `path.resolve()` and `startsWith()`

2. **Input Validation** (cli.js:448-453, ai-enhancer.js:421-436)
   - 50KB prompt length limit
   - String type validation
   - Mode parameter whitelist validation

3. **Error Sanitization** (cli.js:425-430, ai-enhancer.js:372-397)
   - Generic error messages prevent information disclosure
   - No internal paths or stack traces exposed

4. **API Security** (ai-enhancer.js:351-357)
   - Proper HTTP headers with User-Agent
   - Token format validation (hf_ prefix, 20+ chars)
   - Rate limiting awareness

### Security Development Patterns
When adding new features:
```javascript
// ✅ ALWAYS validate file paths
const filePath = path.resolve(userInput);
if (!filePath.startsWith(process.cwd())) {
  throw new Error('Path must be within current directory');
}

// ✅ ALWAYS validate input size
if (input.length > MAX_LENGTH) {
  throw new Error(`Input too long: ${input.length} chars`);
}

// ✅ ALWAYS sanitize errors
catch (error) {
  const safeMessage = error.code === 'ENOENT' ? 'File not found' : 'Error reading file';
  console.error(safeMessage);
}
```

## 💾 Persistent Cache System

### Cache Architecture
The AI enhancer uses a hybrid memory + disk cache:
- **Memory**: LRU cache (1000 entries, 24h TTL)
- **Disk**: JSON files in `~/.cache/claude-enhancer/`
  - `cache-data.json`: Cached responses with expiration
  - `cache-meta.json`: Hit/miss statistics

### Cache Operations
```javascript
// Cache hit/miss tracking in ai-enhancer.js:443-451
const cached = this.cache.get(cacheKey);
if (cached && !options.noCache) {
  this.cacheStats.hits++;
  return cached;
}

// Auto-save after new entries (ai-enhancer.js:486-487)
this.cache.set(cacheKey, enhanced);
this.savePersistentCache().catch(() => {}); // Non-blocking save
```

### Cache Management Commands
```bash
enhance --stats        # View cache statistics and hit rates
enhance --clear-cache  # Clear both memory and disk cache
```

## 🤖 AI Enhancement Patterns

### Model Tiers & Usage
```javascript
// Model selection based on task complexity (ai-enhancer.js:260-270)
fast:     "mistralai/Mixtral-8x7B-Instruct-v0.1" (512 tokens)
balanced: "mistralai/Mixtral-8x7B-Instruct-v0.1" (1024 tokens) 
deep:     "HuggingFaceH4/zephyr-7b-beta" (1500 tokens)
```

### Enhancement Modes
- **balanced**: General purpose with clear structure
- **ultrathink**: Deep reasoning with metacognitive reflection
- **coding**: Technical specifications with testing approach
- **analysis**: Systematic analysis with evidence-based reasoning
- **creative**: Creative briefs with originality focus

### AI Development Patterns
```javascript
// ✅ Always include retry logic (ai-enhancer.js:456-473)
let retries = 3;
while (retries > 0) {
  try {
    enhanced = await this.callHFAPI(prompt, modelKey, mode);
    break;
  } catch (error) {
    retries--;
    if (retries === 0 || error.message.includes('Rate limit')) {
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, (3 - retries) * 1000));
  }
}

// ✅ Always provide fallback to templates
catch (error) {
  console.log('AI enhancement failed, falling back to template...');
  enhanced = enhancementModes[mode].enhance(input);
}
```

## 🛠 Development Guidelines

### Code Patterns for This Project

#### CLI Command Structure
```javascript
// New commands should follow this pattern (cli.js:298-318)
program
  .option('-x, --new-option <value>', 'description')
  .action(async (prompt, options) => {
    // 1. Validate inputs
    // 2. Security checks
    // 3. Process with error handling
    // 4. Provide user feedback
  });
```

#### Error Handling Standards
```javascript
// ✅ Use this pattern throughout the codebase
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  // Log technical details internally only
  console.error('Internal error:', error.message);
  
  // Show safe user message
  const safeMessage = getSafeErrorMessage(error);
  console.error(chalk.red(safeMessage));
  process.exit(1);
}
```

#### File Operations Pattern
```javascript
// ✅ Always validate paths and handle errors safely
async function safeFileOperation(userPath, operation) {
  // Security validation
  const resolvedPath = path.resolve(userPath);
  if (!resolvedPath.startsWith(process.cwd())) {
    throw new Error('Path must be within current directory');
  }
  
  try {
    return await operation(resolvedPath);
  } catch (error) {
    const safeMessage = error.code === 'ENOENT' ? 'File not found' : 
                       error.code === 'EACCES' ? 'Permission denied' :
                       'File operation failed';
    throw new Error(safeMessage);
  }
}
```

### Testing Commands
```bash
# Run linting (add specific commands once identified)
npm run lint      # Check code style and errors
npm run typecheck # Validate TypeScript types
npm test          # Run test suite

# Manual testing patterns
enhance "test prompt" -m coding --ai     # Test AI integration
enhance --check-models                   # Verify API connectivity
enhance --stats                          # Check cache performance
```

## 📋 Claude Code Interaction Patterns

### Effective Prompting for This Project
```
# ✅ Good prompts for this codebase
"Add input validation to the file reading function in cli.js around line 424"
"Implement retry logic for the HF API calls in ai-enhancer.js similar to lines 456-473"
"Add a new enhancement mode called 'research' with systematic analysis patterns"

# ❌ Avoid vague requests
"Make the code better"
"Fix the bugs"
"Add more features"
```

### Memory Management
Update this CLAUDE.md when making significant changes:
```markdown
## Recent Changes
- 2024-01-XX: Added persistent cache system for AI responses
- 2024-01-XX: Implemented comprehensive security audit fixes
- 2024-01-XX: Added new enhancement mode for [specific purpose]
```

### Code Review Checklist
Before implementing changes, verify:
- [ ] Security: Path validation, input sanitization, error handling
- [ ] Caching: Proper cache key generation and persistence
- [ ] AI Integration: Retry logic, fallback to templates, rate limiting
- [ ] Error Messages: User-safe, no internal details exposed
- [ ] Testing: Manual verification with various inputs and edge cases

## 🚀 Quick Reference

### Essential Commands
```bash
enhance "prompt" -m coding --ai          # AI-enhanced coding prompt
enhance --stats                          # View usage statistics
enhance --clear-cache                    # Reset cache
enhance --check-models                   # Test API connectivity
enhance -i                               # Interactive mode
```

### Key Files to Understand
- `cli.js:413-453`: File operations with security validation
- `ai-enhancer.js:421-441`: Input validation and sanitization
- `ai-enhancer.js:456-473`: API retry logic and error handling
- `ai-enhancer.js:92-131`: Persistent cache loading system

### Environment Setup
```bash
# Required environment variables
HF_TOKEN=hf_your_token_here    # Hugging Face API token (Pro recommended)

# Optional configurations
DEFAULT_AI_MODEL=balanced      # Default model tier
CACHE_DIR=~/.cache/claude-enhancer  # Custom cache location
```

---

**Last Updated**: 2024-06-29  
**Project Status**: Security-audited, production-ready  
**Key Maintainer Guidelines**: Security-first, comprehensive error handling, persistent caching
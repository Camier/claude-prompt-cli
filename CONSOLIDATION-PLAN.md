# Code Consolidation Plan

## Audit Results

### 1. Template Lookup Duplication (HIGH PRIORITY)
**Issue**: The same template merging code appears 4 times:
```javascript
const templates = { ...enhancementModes, ...advancedFrameworks, ...enhancedModes };
```

**Solution**: Create a single template getter function:
```javascript
// In cli.js or a utility module
function getAllTemplates() {
  return { ...enhancementModes, ...advancedFrameworks, ...enhancedModes };
}
```

### 2. Mixed Chalk/Theme Usage (MEDIUM PRIORITY)
**Issue**: 
- 41 direct chalk calls in cli.js
- Only 4 theme.getTheme() calls
- Inconsistent styling approach

**Solution**: Migrate all chalk calls to theme system for consistency:
```javascript
// Before:
console.log(chalk.cyan('Message'));

// After:
console.log(theme.colors.primary('Message'));
```

### 3. Provider Selection Logic (MEDIUM PRIORITY)
**Issue**: Complex provider health checking logic inline in cli.js (lines 474-492)

**Solution**: Move to registry.js:
```javascript
// In registry.js
async getHealthyProvider(preferredName = null) {
  if (preferredName) {
    return this.getProvider(preferredName);
  }
  // Health check logic here
  return healthyProvider;
}
```

### 4. Error Handling Patterns (LOW PRIORITY)
**Issue**: Inconsistent error messages and handling

**Solution**: Create error utility:
```javascript
class CLIError {
  static fileNotFound(path) { return 'File not found'; }
  static permissionDenied() { return 'Permission denied'; }
  static providerFailed(name) { return `Provider ${name} failed`; }
}
```

## Consolidation Implementation

### Phase 1: Template Consolidation
1. Create `lib/template-utils.js`:
```javascript
const { enhancementModes, advancedFrameworks, enhancedModes } = require('./templates');

function getAllTemplates() {
  return { ...enhancementModes, ...advancedFrameworks, ...enhancedModes };
}

function getTemplate(mode) {
  const templates = getAllTemplates();
  return templates[mode] || enhancementModes.balanced;
}

module.exports = { getAllTemplates, getTemplate };
```

2. Update cli.js to use template utils (4 locations)

### Phase 2: Theme Migration
1. Add helper to cli.js:
```javascript
// Initialize theme once at startup
let theme;
async function getTheme() {
  if (!theme) {
    await themeManager.initialize();
    theme = themeManager.getTheme();
  }
  return theme;
}
```

2. Replace all chalk calls systematically

### Phase 3: Provider Logic Refactor
1. Move provider selection to registry.js
2. Simplify cli.js provider usage to:
```javascript
const provider = await registry.getHealthyProvider(options.provider);
```

### Phase 4: Error Standardization
1. Create `lib/cli-errors.js`
2. Replace all error messages with standardized ones

## Benefits

1. **Code Reduction**: ~100-150 lines removed
2. **Maintainability**: Single source of truth for templates, themes, errors
3. **Consistency**: Uniform styling and error handling
4. **Performance**: Theme initialized once, templates merged once
5. **Testability**: Isolated utilities easier to test

## Risks & Mitigation

1. **Breaking Changes**: None - all changes internal
2. **Theme Performance**: Lazy initialization prevents startup delay
3. **Testing**: Each phase can be tested independently

## Estimated Impact

- **File Size**: cli.js reduced from 726 to ~600 lines
- **Duplication**: 4 template lookups → 1 utility function
- **Chalk Calls**: 41 → 0 (all through theme)
- **Error Messages**: Standardized across codebase

## Priority Order

1. Template consolidation (immediate - high impact, low risk)
2. Provider logic refactor (quick win - medium impact)
3. Theme migration (systematic - high impact, medium effort)
4. Error standardization (polish - low impact, improves UX)
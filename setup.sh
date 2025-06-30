#!/bin/bash

# Claude Prompt Enhancer v3.0 Complete Setup Script
echo "🧠 Claude Prompt Enhancer v3.0 Setup"
echo "===================================="
echo

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        if [ ! -z "$3" ]; then
            echo "  $3"
        fi
    fi
}

# Check Node.js
echo "Checking prerequisites..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js $NODE_VERSION found"
else
    print_status 1 "Node.js not found" "Please install Node.js 14+ from https://nodejs.org"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status 0 "npm $NPM_VERSION found"
else
    print_status 1 "npm not found" "Please install npm"
    exit 1
fi

# Install dependencies
echo
echo "Installing dependencies..."
npm install
print_status $? "Dependencies installed"

# Create necessary directories
echo
echo "Creating directories..."
mkdir -p ~/.cache/claude-enhancer/templates
mkdir -p examples/prompts
mkdir -p examples/tests
print_status 0 "Directories created"

# Check for existing v2 installation
if [ -f "cli-v2.js" ] || [ -d "backup-v2" ]; then
    echo
    echo -e "${YELLOW}Detected previous v2 installation${NC}"
    read -p "Would you like to migrate settings? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "migrate-to-v3.js" ]; then
            node migrate-to-v3.js
        fi
    fi
fi

# Setup environment file
echo
echo "Setting up configuration..."
if [ -f .env ]; then
    print_status 0 ".env file already exists"
else
    if [ -f env.example ]; then
        cp env.example .env
        print_status 0 "Created .env from template"
        echo "  Edit .env to add API keys for cloud providers"
    else
        # Create basic .env
        cat > .env << EOF
# Claude Prompt Enhancer Configuration
DEFAULT_PROVIDER=ollama
HF_TOKEN=
OLLAMA_BASE_URL=http://localhost:11434
EOF
        print_status 0 "Created basic .env file"
    fi
fi

# Link globally
echo
echo "Setting up global command..."
npm link
print_status $? "Global 'enhance' command linked"

# Check for Ollama
echo
echo "Checking for Ollama (recommended for local LLM)..."
if command_exists ollama; then
    print_status 0 "Ollama found"
    
    # Check if Ollama is running
    if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
        print_status 0 "Ollama service is running"
        
        # List available models
        echo
        echo "Available Ollama models:"
        ollama list 2>/dev/null || echo "  No models installed yet"
    else
        print_status 1 "Ollama installed but not running" "Start with: ollama serve"
    fi
    
    echo
    echo "Recommended models to install:"
    echo "  ollama pull llama2      # General purpose (7B)"
    echo "  ollama pull codellama   # For coding tasks"
    echo "  ollama pull mistral     # Fast & efficient"
    echo "  ollama pull neural-chat # For creative tasks"
else
    print_status 1 "Ollama not found (optional)" "Install from https://ollama.com for free local LLM support"
fi

# Test installation
echo
echo "Testing installation..."

# Check health
if node cli.js --check-health > /dev/null 2>&1; then
    print_status 0 "Health check passed"
else
    print_status 1 "Health check failed" "This is normal if providers aren't configured yet"
fi

# Run a simple template test
TEST_OUTPUT=$(node cli.js "test" --no-ai 2>&1)
if [ $? -eq 0 ]; then
    print_status 0 "Template enhancement working"
else
    print_status 1 "Template enhancement failed" "Check error messages above"
fi

# Create example test file if it doesn't exist
if [ ! -f "examples/tests/basic-tests.yaml" ]; then
    echo
    echo "Creating example test file..."
    cat > examples/tests/basic-tests.yaml << 'EOF'
# Example Prompt Tests
provider: template
mode: balanced

config:
  verbose: true
  useAI: false

tests:
  - name: "Basic test"
    prompt: "hello world"
    assertions:
      - contains: "hello"
      - min_length: 50
EOF
    print_status 0 "Created examples/tests/basic-tests.yaml"
fi

# Success message
echo
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo
echo "Quick Start Guide:"
echo "=================="
echo
echo "1. Basic usage (template mode):"
echo "   enhance \"explain recursion\""
echo
echo "2. With Ollama (if installed):"
echo "   enhance \"write a function\" -p ollama"
echo
echo "3. Interactive mode:"
echo "   enhance -i"
echo
echo "4. View all options:"
echo "   enhance --help"
echo
echo "5. Check provider status:"
echo "   enhance --check-health"
echo
echo "6. View analytics:"
echo "   enhance dashboard"
echo
echo "7. Run tests:"
echo "   enhance --test examples/tests/basic-tests.yaml"
echo
echo "For detailed documentation, see README.md"
echo
echo -e "${GREEN}Enjoy enhanced prompting! 🚀${NC}"
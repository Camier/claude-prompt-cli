#!/bin/bash

# Claude Prompt Enhancer CLI - Installation Script

echo "🧠 Installing Claude Prompt Enhancer CLI..."
echo "========================================"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Navigate to the project directory
cd "$SCRIPT_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Make CLI executable
chmod +x cli.js

# Link globally
echo "🔗 Linking globally..."
npm link

echo ""
echo "✅ Installation complete!"
echo ""
echo "🚀 Quick Start:"
echo "  enhance \"your prompt here\""
echo "  enhance -i                    # Interactive mode"
echo "  enhance --list                # Show all modes"
echo ""
echo "📚 Examples:"
echo "  enhance \"explain AI\" -m ultrathink"
echo "  enhance \"build a CLI\" -m coding -c"
echo ""
echo "Type 'enhance --help' for more options"
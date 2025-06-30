#!/bin/bash

# Add enhance command to PATH

echo "🔧 Setting up 'enhance' command in your PATH..."

# Get npm global bin directory
NPM_BIN=$(npm bin -g 2>/dev/null)

if [ -z "$NPM_BIN" ]; then
    echo "❌ Could not find npm global bin directory"
    exit 1
fi

# Check if enhance is already in PATH
if command -v enhance &> /dev/null; then
    echo "✅ 'enhance' command is already available!"
    enhance --version
    exit 0
fi

# Add to different shell configs
SHELLS=("$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile")

for SHELL_CONFIG in "${SHELLS[@]}"; do
    if [ -f "$SHELL_CONFIG" ]; then
        # Check if npm bin is already in PATH
        if ! grep -q "$NPM_BIN" "$SHELL_CONFIG"; then
            echo "" >> "$SHELL_CONFIG"
            echo "# Claude Prompt Enhancer CLI" >> "$SHELL_CONFIG"
            echo "export PATH=\"$NPM_BIN:\$PATH\"" >> "$SHELL_CONFIG"
            echo "✅ Added to $SHELL_CONFIG"
        else
            echo "ℹ️  npm bin already in $SHELL_CONFIG"
        fi
    fi
done

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Please run one of these commands to activate:"
echo "  source ~/.bashrc    # For bash"
echo "  source ~/.zshrc     # For zsh"
echo ""
echo "Or simply open a new terminal window."
echo ""
echo "Then you can use: enhance \"your prompt\""
#!/bin/bash

# Quick Setup Script for AI Enhancement

echo "🤖 Claude Prompt Enhancer - AI Setup"
echo "==================================="
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
    
    # Check if HF_TOKEN is set
    if grep -q "HF_TOKEN=hf_" .env; then
        echo "✅ HF_TOKEN appears to be configured"
    else
        echo "⚠️  HF_TOKEN not configured in .env"
        echo ""
        echo "To enable AI enhancement:"
        echo "1. Get your token from: https://huggingface.co/settings/tokens"
        echo "2. Edit .env and add: HF_TOKEN=your_token_here"
    fi
else
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  Please configure your HF_TOKEN:"
    echo "1. Get your token from: https://huggingface.co/settings/tokens"
    echo "2. Edit .env and add your token"
fi

echo ""
echo "📊 Testing installation..."
echo ""

# Test basic functionality
echo "1. Testing template enhancement..."
node cli.js "test prompt" -m balanced --no-color | head -5
echo ""

# Check if AI is available
if [ -f ".env" ] && grep -q "HF_TOKEN=hf_" .env; then
    echo "2. Testing AI enhancement..."
    echo "   (This may take a few seconds on first run)"
    node cli.js "explain recursion" --ai --no-color | head -10
    echo ""
    
    echo "3. Checking AI stats..."
    node cli.js --stats
else
    echo "2. AI enhancement not configured"
    echo "   Add your HF_TOKEN to .env to enable AI features"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Quick commands:"
echo "  enhance \"your prompt\"           # Template enhancement"
echo "  enhance \"your prompt\" --ai      # AI enhancement"
echo "  enhance -i                      # Interactive mode"
echo "  enhance --stats                 # Check usage"
echo "  enhance --help                  # All options"
echo ""
echo "Pro tip: Add 'alias ep=enhance' to your .bashrc for quick access!"
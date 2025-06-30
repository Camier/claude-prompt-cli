#!/bin/bash

# Example: Different AI Models Performance

echo "🚀 Claude Prompt Enhancer - AI Model Comparison"
echo "=============================================="
echo ""

PROMPT="explain the concept of emergence in complex systems"

echo "Testing prompt: \"$PROMPT\""
echo ""

# Fast model
echo "⚡ FAST MODEL (Flan-T5 XL)"
echo "─────────────────────────────────────"
START=$(date +%s)
node cli.js "$PROMPT" -m ultrathink --ai --ai-model fast --no-color 2>/dev/null | head -15
END=$(date +%s)
echo ""
echo "Time: $((END-START)) seconds"
echo ""

# Balanced model
echo "⚖️  BALANCED MODEL (Mixtral 8x7B)"
echo "─────────────────────────────────────"
START=$(date +%s)
node cli.js "$PROMPT" -m ultrathink --ai --ai-model balanced --no-color 2>/dev/null | head -15
END=$(date +%s)
echo ""
echo "Time: $((END-START)) seconds"
echo ""

# Deep model (if you want to test - this uses more quota)
echo "🧠 DEEP MODEL (Llama 2 70B)"
echo "─────────────────────────────────────"
echo "(Skipping to save API quota - uncomment to test)"
# START=$(date +%s)
# node cli.js "$PROMPT" -m ultrathink --ai --ai-model deep --no-color 2>/dev/null | head -15
# END=$(date +%s)
# echo ""
# echo "Time: $((END-START)) seconds"

echo ""
echo "💡 Tips:"
echo "- Fast model: Great for quick iterations"
echo "- Balanced model: Best for most use cases"
echo "- Deep model: Reserve for complex reasoning tasks"
#!/bin/bash

# Example: AI Enhancement Comparison

echo "🔬 Claude Prompt Enhancer - AI vs Template Comparison"
echo "===================================================="
echo ""

PROMPT="create a web scraper"

echo "Original prompt: \"$PROMPT\""
echo ""
echo "─────────────────────────────────────────────────"
echo "📝 TEMPLATE ENHANCEMENT (Mode: coding)"
echo "─────────────────────────────────────────────────"
node cli.js "$PROMPT" -m coding --no-color | head -20
echo ""
echo "─────────────────────────────────────────────────"
echo "🤖 AI ENHANCEMENT (Mode: coding, Model: balanced)"
echo "─────────────────────────────────────────────────"
node cli.js "$PROMPT" -m coding --ai --no-color 2>/dev/null | head -20
echo ""
echo "─────────────────────────────────────────────────"
echo ""
echo "💡 Notice how AI enhancement provides more specific and contextual improvements!"
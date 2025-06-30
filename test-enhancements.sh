#!/bin/bash

echo "Testing Claude Prompt Enhancer Enhancements"
echo "==========================================="

# Test 1: List modes
echo -e "\n1. Testing mode listing:"
node cli.js --list | grep -A 5 "ML-Enhanced"

# Test 2: Test smartCode mode
echo -e "\n2. Testing smartCode mode (template):"
node cli.js "Create a function to sort an array" -m smartCode --no-ai 2>/dev/null | head -20

# Test 3: Test with HuggingFace
echo -e "\n3. Testing with HuggingFace AI:"
node cli.js "Explain recursion" -m adaptiveThink --provider huggingface 2>&1 | grep -E "(AI enhancement complete|Enhanced Prompt)" | head -5

# Test 4: Test theme listing
echo -e "\n4. Available themes:"
node cli.js theme --help 2>/dev/null || echo "Theme command: enhance theme"

echo -e "\n✅ All tests complete!"
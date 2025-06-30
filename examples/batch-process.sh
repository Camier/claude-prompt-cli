#!/bin/bash

# Example: Batch Processing with Cache Benefits

echo "📦 Claude Prompt Enhancer - Batch Processing Demo"
echo "==============================================="
echo ""

# Create output directory
mkdir -p enhanced-outputs

echo "Processing multiple prompts from examples/prompts.txt..."
echo ""

# First pass - populate cache
echo "🔄 First pass (populating cache):"
echo "─────────────────────────────────"
START=$(date +%s)
while IFS= read -r prompt; do
    echo -n "Processing: $prompt... "
    node cli.js "$prompt" -m coding --ai -o "enhanced-outputs/$(echo $prompt | tr ' ' '_').txt" 2>/dev/null
    echo "✓"
    sleep 0.5  # Be nice to the API
done < examples/prompts.txt
END=$(date +%s)
FIRST_TIME=$((END-START))
echo "First pass time: ${FIRST_TIME}s"
echo ""

# Check cache stats
echo "📊 Cache Statistics:"
node cli.js --stats | grep -E "(Cache size|Cache hit rate)"
echo ""

# Second pass - benefit from cache
echo "🚀 Second pass (using cache):"
echo "─────────────────────────────────"
START=$(date +%s)
while IFS= read -r prompt; do
    echo -n "Processing: $prompt... "
    node cli.js "$prompt" -m coding --ai -o "enhanced-outputs/$(echo $prompt | tr ' ' '_')_cached.txt" 2>/dev/null
    echo "✓ (cached)"
done < examples/prompts.txt
END=$(date +%s)
SECOND_TIME=$((END-START))
echo "Second pass time: ${SECOND_TIME}s"
echo ""

# Show time savings
SAVED=$((FIRST_TIME - SECOND_TIME))
PERCENT=$((SAVED * 100 / FIRST_TIME))
echo "⏱️  Time saved: ${SAVED}s (${PERCENT}% faster)"
echo ""

echo "💡 Cache Benefits:"
echo "- Instant responses for repeated prompts"
echo "- Reduces API quota usage"
echo "- Consistent results for same inputs"
echo ""
echo "Enhanced prompts saved in: enhanced-outputs/"
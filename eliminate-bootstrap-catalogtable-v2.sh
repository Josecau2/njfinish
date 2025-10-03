#!/bin/bash

# Script to eliminate Bootstrap utility classes from CatalogTable.js
# Version 2: Handles closing tags properly using Python for complex replacements

FILE="frontend/src/components/CatalogTable.js"

# Create Python script to handle tag matching
cat > /tmp/fix_catalog.py << 'PYTHON_SCRIPT'
import re
import sys

def fix_catalog_table(content):
    # Track replacements to handle closing tags
    replacements = []

    # Pattern 1: d-flex with various attributes - simpler approach
    # Just replace the opening tags, don't touch closing tags
    content = re.sub(
        r'<div className="d-flex flex-wrap gap-3 align-items-center justify-content-between([^"]*)"',
        r'<Flex flexWrap="wrap" gap={3} align="center" justify="space-between"\1"',
        content
    )

    content = re.sub(
        r'<div className="d-flex flex-wrap align-items-center gap-3 flex-shrink-0">',
        r'<Flex flexWrap="wrap" align="center" gap={3} flexShrink={0}>',
        content
    )

    content = re.sub(
        r'<div className="d-flex align-items-center gap-2">',
        r'<Flex align="center" gap={2}>',
        content
    )

    content = re.sub(
        r'<div className="d-flex flex-column flex-md-row gap-4">',
        r'<Flex flexDir={{ base: "column", md: "row" }} gap={4}>',
        content
    )

    content = re.sub(
        r'className="d-flex align-items-center gap-2 flex-wrap"',
        r'align="center" gap={2} flexWrap="wrap"',
        content
    )

    content = re.sub(
        r'<div className="d-flex gap-1">',
        r'<Flex gap={1}>',
        content
    )

    content = re.sub(
        r'<div className="d-flex align-items-center">',
        r'<Flex align="center">',
        content
    )

    content = re.sub(
        r'<div className="d-flex align-items-center flex-wrap gap-2">',
        r'<Flex align="center" flexWrap="wrap" gap={2}>',
        content
    )

    content = re.sub(
        r'<div className="mt-1 d-flex flex-wrap gap-1">',
        r'<Flex mt={1} flexWrap="wrap" gap={1}>',
        content
    )

    # Now fix the matching closing </div> tags by replacing with </Flex>
    # ONLY for the lines we converted to <Flex>
    # This is tricky - we need to count and match

    # Simpler approach: Split by lines and track depth
    lines = content.split('\n')
    result_lines = []
    flex_depth = 0

    for line in lines:
        # Count Flex openings
        flex_opens = line.count('<Flex')
        flex_closes = line.count('</Flex>')

        # If line has opening Flex, increment depth
        if flex_opens > 0:
            flex_depth += flex_opens

        # Replace </div> with </Flex> if we're inside a Flex
        if '</div>' in line and flex_depth > 0:
            line = line.replace('</div>', '</Flex>', 1)
            flex_depth -= 1

        # Account for Flex closes
        if flex_closes > 0:
            flex_depth -= flex_closes

        result_lines.append(line)

    content = '\n'.join(result_lines)

    # Other simple replacements
    content = re.sub(r'className="mt-5 mb-5"', r'mt={5} mb={5}', content)
    content = re.sub(r'className="text-muted ', r'color="gray.600" className="', content)
    content = re.sub(r'className="text-danger ', r'color="red.500" className="', content)
    content = re.sub(r'className="badge text-bg-secondary', r'colorScheme="gray" className="badge', content)

    return content

# Read file
with open(sys.argv[1], 'r', encoding='utf-8') as f:
    content = f.read()

# Fix it
fixed = fix_catalog_table(content)

# Write back
with open(sys.argv[1], 'w', encoding='utf-8') as f:
    f.write(fixed)

print("Fixed CatalogTable.js")
PYTHON_SCRIPT

# Run the Python script
python /tmp/fix_catalog.py "$FILE"

echo "Bootstrap elimination complete for CatalogTable.js (v2)"
echo "Testing build..."

#!/bin/bash
# Fix ItemSelectionContentEdit.jsx - 26 hardcoded colors

cd frontend/src/components

# First, check if useColorModeValue is imported
if ! grep -q "useColorModeValue" ItemSelectionContentEdit.jsx; then
  # Add import
  sed -i 's/} from '\''@chakra-ui\/react'\''/,  useColorModeValue } from '\''@chakra-ui\/react'\''/g' ItemSelectionContentEdit.jsx
fi

# Now add the color variables after the component declaration
# Find the line with the component name and add variables after hooks
# This is complex, so I'll do it manually through the Edit tool

echo "ItemSelectionContentEdit.jsx - prepared for manual fixes"

#!/bin/bash

# Script to fix all remaining DatePicker instances in EditProposal.jsx
# Replaces react-datepicker with native HTML5 date inputs

set -e  # Exit on error

FILE="frontend/src/pages/proposals/EditProposal.jsx"

echo "====== Fixing EditProposal.jsx DatePickers ======"
echo "Creating backup..."
cp "$FILE" "${FILE}.backup.$(date +%s)"

# Create a Python script to do the complex replacements
cat > /tmp/fix_datepickers.py << 'PYTHON_SCRIPT'
import re
import sys

def fix_datepicker(content):
    # Pattern to match DatePicker blocks with Calendar icon
    # We'll replace them one at a time to be precise

    # Replace date field (around line 570-593)
    content = re.sub(
        r'<Box position="relative">\s*<FormLabel htmlFor="date">Date</FormLabel>\s*<DatePicker\s+id="date"[^>]*selected=\{formData\.date[^}]*\}[^>]*onChange=\{[^}]*\}[^/]*/>\s*<Calendar[^/]*/>\s*</Box>',
        r'<FormLabel htmlFor="date">Date</FormLabel>\n                  <Input\n                    type="date"\n                    id="date"\n                    value={formData.date ? new Date(formData.date).toISOString().split(\'T\')[0] : \'\'}\n                    onChange={(e) => updateFormData({ date: e.target.value })}\n                    isDisabled={isFormDisabled}\n                  />',
        content,
        flags=re.DOTALL
    )

    # Replace designDate field
    content = re.sub(
        r'<Box position="relative">\s*<FormLabel htmlFor="designDate">[\s\S]*?</FormLabel>\s*<DatePicker\s+id="designDate"[^>]*selected=\{formData\.designDate[^}]*\}[^>]*onChange=\{[^}]*\}[^/]*/>\s*<Calendar[^/]*/>\s*</Box>',
        r'<FormLabel htmlFor="designDate">\n                      {t(\'common.designDate\', \'Design Date\')}\n                    </FormLabel>\n                  <Input\n                    type="date"\n                    id="designDate"\n                    value={formData.designDate ? new Date(formData.designDate).toISOString().split(\'T\')[0] : \'\'}\n                    onChange={(e) => updateFormData({ designDate: e.target.value })}\n                    isDisabled={isFormDisabled}\n                  />',
        content,
        flags=re.DOTALL
    )

    # Replace measurementDate field
    content = re.sub(
        r'<Box position="relative">\s*<FormLabel htmlFor="measurementDate">[\s\S]*?</FormLabel>\s*<DatePicker\s+id="measurementDate"[^>]*selected=\{formData\.measurementDate[^}]*\}[^>]*onChange=\{[^}]*\}[^/]*/>\s*<Calendar[^/]*/>\s*</Box>',
        r'<FormLabel htmlFor="measurementDate">\n                      {t(\'common.measurementDate\', \'Measurement Date\')}\n                    </FormLabel>\n                  <Input\n                    type="date"\n                    id="measurementDate"\n                    value={formData.measurementDate ? new Date(formData.measurementDate).toISOString().split(\'T\')[0] : \'\'}\n                    onChange={(e) => updateFormData({ measurementDate: e.target.value })}\n                    isDisabled={isFormDisabled}\n                  />',
        content,
        flags=re.DOTALL
    )

    # Replace any remaining DatePicker instances (status-specific dates)
    # Generic replacement for any remaining DatePicker
    content = re.sub(
        r'<DatePicker\s+id="([^"]+)"\s+selected=\{formData\.([a-zA-Z0-9]+)[^}]*\}\s+onChange=\{[^}]*\}[^/]*/>\s*<(?:Calendar|FaCalendarAlt)[^/]*/?>',
        r'<Input type="date" id="\1" value={formData.\2 ? new Date(formData.\2).toISOString().split(\'T\')[0] : \'\'} onChange={(e) => updateFormData({ \2: e.target.value })} isDisabled={isFormDisabled} />',
        content,
        flags=re.DOTALL
    )

    return content

with open(sys.argv[1], 'r', encoding='utf-8') as f:
    content = f.read()

content = fix_datepicker(content)

with open(sys.argv[1], 'w', encoding='utf-8') as f:
    f.write(content)

print("DatePicker replacements completed successfully!")
PYTHON_SCRIPT

# Run the Python script
python /tmp/fix_datepickers.py "$FILE"

# Now remove the DatePicker import line (if not already removed)
sed -i '/^import DatePicker from/d' "$FILE"

# Also ensure react-datepicker comment is updated
sed -i 's|^// Removed react-select/creatable.*|// Removed react-select/creatable - using Chakra Select\n// Removed react-datepicker - using native HTML5 date inputs|' "$FILE"

echo "====== DONE ======"
echo "Changes made to $FILE"
echo ""
echo "Now running build to check for errors..."

# Try to build
npm run build 2>&1 | tee /tmp/build-output.txt

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✓ BUILD SUCCESSFUL!"
    echo ""
    echo "Changes are good. Ready to commit."
else
    echo "✗ BUILD FAILED!"
    echo ""
    echo "Restoring from backup..."
    cp "${FILE}.backup."* "$FILE" 2>/dev/null || echo "No backup to restore"
    echo "Please check /tmp/build-output.txt for errors"
    exit 1
fi

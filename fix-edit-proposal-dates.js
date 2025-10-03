/**
 * Script to replace all DatePicker instances in EditProposal.jsx with native HTML5 date inputs
 * This will:
 * 1. Remove react-datepicker import
 * 2. Replace all DatePicker components with Input type="date"
 * 3. Remove Calendar icon components
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/proposals/EditProposal.jsx');

console.log('====== Fixing EditProposal.jsx DatePickers ======');

// Create backup
const backupPath = filePath + '.backup.' + Date.now();
fs.copyFileSync(filePath, backupPath);
console.log(`✓ Backup created: ${backupPath}`);

// Read file
let content = fs.readFileSync(filePath, 'utf8');

// Track changes
let changeCount = 0;

// 1. Remove DatePicker import (if still exists)
const beforeImport = content;
content = content.replace(/import DatePicker from 'react-datepicker'\s*\n/g, '');
if (content !== beforeImport) {
  changeCount++;
  console.log('✓ Removed DatePicker import');
}

// 2. Update the comment about removed libraries
content = content.replace(
  /\/\/ Removed react-datepicker.*\n/,
  '// Removed react-datepicker - using native HTML5 date inputs\n'
);

// 3. Replace DatePicker + Calendar blocks with Input type="date"
// This handles the standard pattern with Box position="relative" wrapper

// Pattern for date field
content = content.replace(
  /<Box position="relative">\s*<FormLabel htmlFor="date">Date<\/FormLabel>\s*<DatePicker[\s\S]*?\/>\s*<Calendar[\s\S]*?\/>\s*<\/Box>/,
  `<FormLabel htmlFor="date">Date</FormLabel>
                  <Input
                    type="date"
                    id="date"
                    value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                    onChange={(e) => updateFormData({ date: e.target.value })}
                    isDisabled={isFormDisabled}
                  />`
);

// Pattern for designDate field
content = content.replace(
  /<Box position="relative">\s*<FormLabel htmlFor="designDate">[\s\S]*?<\/FormLabel>\s*<DatePicker[\s\S]*?id="designDate"[\s\S]*?\/>\s*<Calendar[\s\S]*?\/>\s*<\/Box>/,
  `<FormLabel htmlFor="designDate">
                      {t('common.designDate', 'Design Date')}
                    </FormLabel>
                  <Input
                    type="date"
                    id="designDate"
                    value={formData.designDate ? new Date(formData.designDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => updateFormData({ designDate: e.target.value })}
                    isDisabled={isFormDisabled}
                  />`
);

// Pattern for measurementDate field
content = content.replace(
  /<Box position="relative">\s*<FormLabel htmlFor="measurementDate">[\s\S]*?<\/FormLabel>\s*<DatePicker[\s\S]*?id="measurementDate"[\s\S]*?\/>\s*<Calendar[\s\S]*?\/>\s*<\/Box>/,
  `<FormLabel htmlFor="measurementDate">
                      {t('common.measurementDate', 'Measurement Date')}
                    </FormLabel>
                  <Input
                    type="date"
                    id="measurementDate"
                    value={formData.measurementDate ? new Date(formData.measurementDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => updateFormData({ measurementDate: e.target.value })}
                    isDisabled={isFormDisabled}
                  />`
);

// 4. Handle any remaining DatePicker instances in the status-based sections
// These follow a different pattern with position: relative in a div
const statusDatePickerPattern = /<div style=\{\{ position: 'relative' \}\}>\s*<FormLabel htmlFor="([^"]+)">[\s\S]*?<\/FormLabel>\s*<DatePicker\s+id="\1"[\s\S]*?selected=\{formData\.(\w+)[\s\S]*?\/>\s*<FaCalendarAlt[\s\S]*?\/>\s*<\/div>/g;

content = content.replace(statusDatePickerPattern, (match, fieldId, fieldName) => {
  changeCount++;
  return `<FormLabel htmlFor="${fieldId}">{t('proposals.status.${fieldName}', '${fieldName}')} {t('proposals.headers.date')}</FormLabel>
                            <Input
                              type="date"
                              id="${fieldId}"
                              value={formData.${fieldName} ? new Date(formData.${fieldName}).toISOString().split('T')[0] : ''}
                              onChange={(e) => updateFormData({ ${fieldName}: e.target.value })}
                              isDisabled={isFormDisabled}
                            />`;
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log(`✓ Replaced all DatePicker instances`);
console.log('');
console.log('====== Changes Applied Successfully ======');
console.log('File:', filePath);
console.log('Backup:', backupPath);
console.log('');
console.log('Next step: Run npm run build to verify...');

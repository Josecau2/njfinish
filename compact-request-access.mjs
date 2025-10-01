import { readFileSync, writeFileSync } from 'fs';

const file = 'frontend/src/pages/auth/RequestAccessPage.jsx';
let content = readFileSync(file, 'utf8');

// Change all remaining FormLabel from fontSize="sm" to fontSize="xs"
content = content.replace(/(<FormLabel[^>]*fontSize=")sm(")/g, '$1xs$2');

// Change all remaining Input size="lg" to size="md"
content = content.replace(/(<Input[^>]*size=")lg(")/g, '$1md$2');

// Change Textarea from rows 2/3 to rows 2/2
content = content.replace(/rows=\{\{ base: 2, lg: 3 \}\}/g, 'rows={{ base: 2, lg: 2 }}');

writeFileSync(file, content, 'utf8');
console.log('✓ RequestAccessPage compacted - smaller labels, inputs, and textarea');

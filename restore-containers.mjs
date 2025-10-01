import fs from 'fs';
import path from 'path';

const fixes = [
  {
    file: 'frontend/src/pages/proposals/Proposals.jsx',
    addImport: 'Container',
    changes: [
      {
        from: `    <Box maxW="1200px" mx="auto" p={4}>`,
        to: `    <Container maxW="7xl" py={6}>`
      },
      {
        from: `    </Box>`,
        to: `    </Container>`,
        atEnd: true
      }
    ]
  },
  {
    file: 'frontend/src/pages/settings/globalMods/GlobalModsPage.jsx',
    addImport: 'Container',
    changes: [
      {
        from: `      <div className="container-fluid">`,
        to: `      <Container maxW="container.xl" py={8}>`
      },
      {
        from: `      </div>`,
        to: `      </Container>`,
        atEnd: true
      }
    ]
  },
  {
    file: 'frontend/src/pages/settings/terms/TermsPage.jsx',
    addImport: 'Container',
    changes: [
      {
        from: `  return (`,
        to: `  return (\n    <Container maxW="container.xl" py={8}>`,
        addClosing: true
      }
    ]
  }
];

fixes.forEach(fix => {
  const filePath = path.join(process.cwd(), fix.file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${fix.file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Add Container to imports if needed
  if (fix.addImport && !content.includes('Container,')) {
    content = content.replace(
      /@chakra-ui\/react'\s*}\s*from/,
      match => {
        const lines = content.split('\n');
        const importStart = content.indexOf("from '@chakra-ui/react'");
        const importSection = content.substring(0, importStart);
        const lastComma = importSection.lastIndexOf(',');

        if (lastComma > 0) {
          return content.substring(0, lastComma + 1) + '\n  Container,' + content.substring(lastComma + 1);
        }
        return match;
      }
    );

    // Simpler approach - just add Container after Box
    if (content.includes('  Box,')) {
      content = content.replace('  Box,', '  Box,\n  Container,');
    }
  }

  // Apply changes
  fix.changes.forEach(change => {
    if (change.from && change.to) {
      if (change.atEnd) {
        // Replace last occurrence
        const lastIndex = content.lastIndexOf(change.from);
        if (lastIndex !== -1) {
          content = content.substring(0, lastIndex) + change.to + content.substring(lastIndex + change.from.length);
        }
      } else {
        content = content.replace(change.from, change.to);
      }
    }

    if (change.addClosing) {
      // Add </Container> before the last closing parenthesis
      const lastParen = content.lastIndexOf('\n  )\n}');
      if (lastParen !== -1) {
        content = content.substring(0, lastParen) + '\n    </Container>' + content.substring(lastParen);
      }
    }
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed: ${fix.file}`);
});

console.log('\n✅ All container fixes applied!');

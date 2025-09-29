#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const sourceDir = './frontend/src';

// Function to fix corrupted Modal structures in a file
function fixModalStructures(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Pattern to detect and fix corrupted Modal structures
    let newContent = content;
    let changed = false;

    // Fix patterns like:
    // <ModalHeader>
    // <ModalOverlay />
    // <ModalContent>Title</ModalHeader>

    // Pattern 1: ModalHeader with nested ModalOverlay/ModalContent
    const headerPattern = /(<ModalHeader[^>]*>)\s*<ModalOverlay\s*\/>\s*<ModalContent[^>]*>([^<]*)<\/ModalHeader>/g;
    if (headerPattern.test(newContent)) {
      newContent = newContent.replace(headerPattern, '$1$2</ModalHeader>');
      changed = true;
    }

    // Pattern 2: ModalBody with nested ModalOverlay/ModalContent
    const bodyPattern = /(<ModalBody[^>]*>)\s*<ModalOverlay\s*\/>\s*<ModalContent[^>]*>([^<]*)<\/ModalBody>/g;
    if (bodyPattern.test(newContent)) {
      newContent = newContent.replace(bodyPattern, '$1$2</ModalBody>');
      changed = true;
    }

    // Pattern 3: Orphaned ModalOverlay/ModalContent pairs
    const orphanPattern = /\s*<ModalOverlay\s*\/>\s*<ModalContent[^>]*>/g;
    if (orphanPattern.test(newContent)) {
      newContent = newContent.replace(orphanPattern, '');
      changed = true;
    }

    // Pattern 4: Orphaned closing ModalContent tags
    const orphanClosePattern = /\s*<\/ModalContent>\s*(?=\s*<ModalFooter)/g;
    if (orphanClosePattern.test(newContent)) {
      newContent = newContent.replace(orphanClosePattern, '');
      changed = true;
    }

    // Pattern 5: Fix Modal structure order - ensure proper nesting
    // Modal > ModalOverlay + ModalContent > ModalHeader + ModalBody + ModalFooter
    const modalStructurePattern = /<Modal([^>]*)>\s*(?!<ModalOverlay)([^]*?)<\/Modal>/g;
    newContent = newContent.replace(modalStructurePattern, (match, modalAttrs, modalContent) => {
      // Check if ModalOverlay and ModalContent are properly structured
      if (!modalContent.includes('<ModalOverlay') || !modalContent.includes('<ModalContent>')) {
        changed = true;
        return `<Modal${modalAttrs}>
        <ModalOverlay />
        <ModalContent>
${modalContent.trim()}
        </ModalContent>
      </Modal>`;
      }
      return match;
    });

    if (changed) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }

    return false;

  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to scan and fix all files
function fixAllFiles() {
  const patterns = [
    `${sourceDir}/**/*.jsx`,
    `${sourceDir}/**/*.tsx`
  ];

  let totalFixed = 0;

  for (const pattern of patterns) {
    const files = glob.sync(pattern);

    console.log(`Checking ${files.length} files matching ${pattern}...`);

    for (const file of files) {
      const fixed = fixModalStructures(file);
      if (fixed) {
        console.log(`Fixed: ${file}`);
        totalFixed++;
      }
    }
  }

  console.log(`\nTotal files fixed: ${totalFixed}`);
}

// Run the script
if (require.main === module) {
  console.log('Fixing Modal structure issues...');
  fixAllFiles();
  console.log('Done!');
}

module.exports = { fixModalStructures, fixAllFiles };
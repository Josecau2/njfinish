#!/usr/bin/env python3
"""
Script to eliminate Bootstrap from CatalogMappingTab.jsx with proper tag matching
"""

import re
import sys

def fix_bootstrap_carefully(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    changes = []
    total_changes = 0

    # Process line by line, tracking depth for proper closing tags
    i = 0
    while i < len(lines):
        line = lines[i]
        original_line = line

        # Pattern 1: <div className="d-flex justify-content-between align-items-center mb-1">
        if '<div className="d-flex justify-content-between align-items-center mb-1"' in line:
            lines[i] = line.replace(
                '<div className="d-flex justify-content-between align-items-center mb-1"',
                '<Flex justify="space-between" align="center" mb={1}'
            )
            # Find and fix corresponding </div>
            depth = 1
            j = i + 1
            while j < len(lines) and depth > 0:
                if '<div' in lines[j] and 'className=' in lines[j]:
                    depth += 1
                elif '</div>' in lines[j]:
                    depth -= 1
                    if depth == 0:
                        lines[j] = lines[j].replace('</div>', '</Flex>', 1)
                        break
                j += 1
            if lines[i] != original_line:
                changes.append(f"Line {i+1}: d-flex justify-content-between align-items-center mb-1")
                total_changes += 1

        # Pattern 2: <div className="d-flex justify-content-between align-items-center mb-3">
        elif '<div className="d-flex justify-content-between align-items-center mb-3"' in line:
            lines[i] = line.replace(
                '<div className="d-flex justify-content-between align-items-center mb-3"',
                '<Flex justify="space-between" align="center" mb={3}'
            )
            depth = 1
            j = i + 1
            while j < len(lines) and depth > 0:
                if '<div' in lines[j] and 'className=' in lines[j]:
                    depth += 1
                elif '</div>' in lines[j]:
                    depth -= 1
                    if depth == 0:
                        lines[j] = lines[j].replace('</div>', '</Flex>', 1)
                        break
                j += 1
            if lines[i] != original_line:
                changes.append(f"Line {i+1}: d-flex justify-content-between align-items-center mb-3")
                total_changes += 1

        # Pattern 3: <div className="d-flex gap-2 justify-content-end mt-3">
        elif '<div className="d-flex gap-2 justify-content-end mt-3"' in line:
            lines[i] = line.replace(
                '<div className="d-flex gap-2 justify-content-end mt-3"',
                '<Flex gap={2} justify="flex-end" mt={3}'
            )
            depth = 1
            j = i + 1
            while j < len(lines) and depth > 0:
                if '<div' in lines[j] and 'className=' in lines[j]:
                    depth += 1
                elif '</div>' in lines[j]:
                    depth -= 1
                    if depth == 0:
                        lines[j] = lines[j].replace('</div>', '</Flex>', 1)
                        break
                j += 1
            if lines[i] != original_line:
                changes.append(f"Line {i+1}: d-flex gap-2 justify-content-end mt-3")
                total_changes += 1

        i += 1

    # Write changes
    if total_changes > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print(f"[SUCCESS] Updated {filepath}")
        print(f"Total changes: {total_changes}")
        for change in changes[:10]:  # Show first 10
            print(f"  - {change}")
        if len(changes) > 10:
            print(f"  ... and {len(changes) - 10} more")
        return True
    else:
        print(f"No changes needed in {filepath}")
        return False

if __name__ == '__main__':
    filepath = 'frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx'
    success = fix_bootstrap_carefully(filepath)
    sys.exit(0 if success else 1)

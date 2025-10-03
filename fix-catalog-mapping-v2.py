#!/usr/bin/env python3
"""
Script to eliminate ALL Bootstrap utility classes from CatalogMappingTab.jsx
Converts Bootstrap classes to Chakra UI components/props
"""

import re
import sys

def fix_bootstrap_in_catalog_mapping(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Track number of replacements
    total_replacements = 0

    # Simpler approach: replace specific class patterns
    replacements = [
        # d-flex patterns
        ('className="d-flex justify-content-between align-items-center mb-1"',
         'display="flex" justifyContent="space-between" alignItems="center" mb={1}'),

        ('className="d-flex justify-content-between align-items-center mb-3"',
         'display="flex" justifyContent="space-between" alignItems="center" mb={3}'),

        ('className="d-flex gap-2 justify-content-end mt-3"',
         'display="flex" gap={2} justifyContent="flex-end" mt={3}'),

        (r'<div className="d-flex justify-content-between align-items-center mb-1"',
         r'<Flex justify="space-between" align="center" mb={1}'),

        (r'<div className="d-flex justify-content-between align-items-center mb-3"',
         r'<Flex justify="space-between" align="center" mb={3}'),

        (r'<div className="d-flex gap-2 justify-content-end mt-3"',
         r'<Flex gap={2} justify="flex-end" mt={3}'),
    ]

    for old, new in replacements:
        before = content
        content = content.replace(old, new)
        count = before.count(old)
        if count > 0:
            total_replacements += count
            print(f"  Replaced {count} instance(s) of: {old[:60]}...")

    # Write changes
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n[SUCCESS] Updated {filepath}")
        print(f"Total replacements: {total_replacements}")
        return True
    else:
        print(f"No changes needed in {filepath}")
        return False

if __name__ == '__main__':
    filepath = 'frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx'
    success = fix_bootstrap_in_catalog_mapping(filepath)
    sys.exit(0 if success else 1)

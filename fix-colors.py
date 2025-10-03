#!/usr/bin/env python3
"""
Night Mode Color Fix Script
Systematically replaces hardcoded colors with useColorModeValue
"""

import os
import re
import sys
from pathlib import Path

# Color mappings: (prop, oldValue) -> newValue
COLOR_FIXES = [
    # Background colors
    (r'bg="white"', r'bg={useColorModeValue("white", "gray.800")}'),
    (r"bg='white'", r"bg={useColorModeValue('white', 'gray.800')}"),
    (r'bg="gray\.50"', r'bg={useColorModeValue("gray.50", "gray.800")}'),
    (r"bg='gray\.50'", r"bg={useColorModeValue('gray.50', 'gray.800')}"),
    (r'bg="gray\.100"', r'bg={useColorModeValue("gray.100", "gray.700")}'),
    (r"bg='gray\.100'", r"bg={useColorModeValue('gray.100', 'gray.700')}"),
    (r'bg="blue\.50"', r'bg={useColorModeValue("blue.50", "blue.900")}'),
    (r'bg="green\.50"', r'bg={useColorModeValue("green.50", "green.900")}'),
    (r'bg="yellow\.50"', r'bg={useColorModeValue("yellow.50", "yellow.900")}'),
    (r'bg="orange\.50"', r'bg={useColorModeValue("orange.50", "orange.900")}'),
    (r'bg="purple\.50"', r'bg={useColorModeValue("purple.50", "purple.900")}'),
    (r'bg="teal\.50"', r'bg={useColorModeValue("teal.50", "teal.900")}'),

    # Text colors
    (r'color="gray\.700"', r'color={useColorModeValue("gray.700", "gray.300")}'),
    (r"color='gray\.700'", r"color={useColorModeValue('gray.700', 'gray.300')}"),
    (r'color="gray\.600"', r'color={useColorModeValue("gray.600", "gray.400")}'),
    (r"color='gray\.600'", r"color={useColorModeValue('gray.600', 'gray.400')}"),
    (r'color="gray\.500"', r'color={useColorModeValue("gray.500", "gray.400")}'),
    (r"color='gray\.500'", r"color={useColorModeValue('gray.500', 'gray.400')}"),
    (r'color="gray\.400"', r'color={useColorModeValue("gray.400", "gray.500")}'),
    (r"color='gray\.400'", r"color={useColorModeValue('gray.400', 'gray.500')}"),
    (r'color="gray\.800"', r'color={useColorModeValue("gray.800", "gray.200")}'),
    (r'color="blue\.600"', r'color={useColorModeValue("blue.600", "blue.300")}'),
    (r'color="blue\.500"', r'color={useColorModeValue("blue.500", "blue.300")}'),

    # Border colors
    (r'borderColor="gray\.200"', r'borderColor={useColorModeValue("gray.200", "gray.600")}'),
    (r"borderColor='gray\.200'", r"borderColor={useColorModeValue('gray.200', 'gray.600')}"),
    (r'borderColor="gray\.300"', r'borderColor={useColorModeValue("gray.300", "gray.600")}'),
]

def ensure_import(content):
    """Add useColorModeValue to Chakra UI import if needed"""
    chakra_import = re.search(r'import\s+{([^}]+)}\s+from\s+[\'"]@chakra-ui/react[\'"]', content)

    if not chakra_import:
        return content, False

    imports = [imp.strip() for imp in chakra_import.group(1).split(',')]

    if 'useColorModeValue' in imports:
        return content, False

    imports.append('useColorModeValue')
    new_import = f"import {{ {', '.join(imports)} }} from '@chakra-ui/react'"
    content = content[:chakra_import.start()] + new_import + content[chakra_import.end():]

    return content, True

def fix_file(file_path):
    """Fix color values in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        fixes = 0

        # Apply color fixes
        for pattern, replacement in COLOR_FIXES:
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                fixes += 1

        # If any fixes were made, ensure import exists
        if content != original_content:
            content, import_added = ensure_import(content)

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            return True, fixes

        return False, 0

    except Exception as e:
        print(f"  ERR Error: {e}")
        return False, 0

def process_files(file_list):
    """Process a list of files"""
    total_files = 0
    total_fixed = 0
    total_changes = 0

    for file_path in file_list:
        if not os.path.exists(file_path):
            continue

        total_files += 1
        modified, fixes = fix_file(file_path)

        if modified:
            print(f"  OK {os.path.basename(file_path)}: {fixes} fixes")
            total_fixed += 1
            total_changes += fixes

    return total_files, total_fixed, total_changes

# Phase-specific file lists
PHASES = {
    'phase5': {
        'name': 'Core Page Components',
        'files': [
            'frontend/src/pages/dashboard/Dashboard.jsx',
            'frontend/src/pages/proposals/Proposals.jsx',
            'frontend/src/pages/customers/Customers.jsx',
            'frontend/src/pages/orders/OrdersList.jsx',
            'frontend/src/pages/admin/Contractors.jsx',
        ]
    },
    'phase6': {
        'name': 'Table Components',
        'files': [
            'frontend/src/components/CatalogTable.js',
            'frontend/src/pages/settings/users/UserList.jsx',
            'frontend/src/pages/settings/manufacturers/ManufacturersList.jsx',
        ]
    },
    'phase7': {
        'name': 'Modal Components',
        'files': [
            'frontend/src/components/NeutralModal.jsx',
            'frontend/src/components/TermsModal.jsx',
            'frontend/src/components/model/ModificationBrowserModal.jsx',
        ]
    },
    'phase8': {
        'name': 'Settings & Forms',
        'files': [
            'frontend/src/pages/settings/customization/CustomizationPage.jsx',
            'frontend/src/pages/settings/customization/LoginCustomizerPage.jsx',
            'frontend/src/pages/settings/users/CreateUser.jsx',
            'frontend/src/components/common/PaginationComponent.jsx',
        ]
    },
}

def main():
    phase = sys.argv[1] if len(sys.argv) > 1 else 'phase5'

    print(f"\n>>> Night Mode Fix - {phase.upper()}\n")
    print("=" * 70)

    if phase not in PHASES:
        print(f"\nX Unknown phase: {phase}")
        print(f"Available phases: {', '.join(PHASES.keys())}")
        return 1

    config = PHASES[phase]
    print(f"\n>>> {config['name']}")
    print("-" * 70)

    files, fixed, changes = process_files(config['files'])

    print("\n" + "=" * 70)
    print(f"\n>>> Complete: {fixed}/{files} files updated, {changes} total fixes\n")

    return 0

if __name__ == '__main__':
    sys.exit(main())

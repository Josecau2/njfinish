#!/usr/bin/env python3
"""
Fix React Hooks Ordering Issues
Moves all useColorModeValue calls from JSX to top-level const declarations
"""

import os
import re
import sys

def extract_inline_hooks(content):
    """Find all inline useColorModeValue calls in JSX"""
    # Pattern: useColorModeValue("value1", "value2")
    pattern = r'useColorModeValue\([\'"]([^\'"]+)[\'"]\s*,\s*[\'"]([^\'"]+)[\'"]\)'
    matches = re.findall(pattern, content)
    return matches

def generate_var_name(light_val, dark_val):
    """Generate a descriptive variable name from color values"""
    # Extract color name/number from values like "gray.600" or "white"
    light_parts = light_val.replace('.', '_').replace('-', '_')
    dark_parts = dark_val.replace('.', '_').replace('-', '_')

    # Common patterns
    if 'white' in light_val and 'gray' in dark_val:
        return 'bgWhite'
    elif 'gray.50' in light_val:
        return 'bgGray50'
    elif 'gray.100' in light_val:
        return 'bgGray100'
    elif 'gray.700' in light_val:
        return 'textPrimary'
    elif 'gray.600' in light_val:
        return 'textSecondary'
    elif 'gray.500' in light_val:
        return 'textMuted'
    elif 'gray.400' in light_val:
        return 'iconColor'
    elif 'gray.200' in light_val:
        return 'borderColor'
    elif 'blue' in light_val:
        return 'linkColor'
    elif 'green' in light_val:
        return 'successColor'
    elif 'red' in light_val:
        return 'errorColor'
    else:
        return f'color_{light_parts}'

def fix_file(file_path):
    """Fix hooks ordering in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Extract all inline useColorModeValue calls
        hooks = extract_inline_hooks(content)
        if not hooks:
            return False, 0

        # Find where to insert the const declarations
        # Look for existing useColorModeValue imports/usage
        chakra_import = re.search(r'import.*useColorModeValue.*from [\'"]@chakra-ui/react[\'"]', content)
        if not chakra_import:
            return False, 0

        # Find the component function
        component_func = re.search(r'(const|function)\s+\w+\s*=.*?{', content)
        if not component_func:
            return False, 0

        # Find existing const declarations or hooks
        insert_pos = component_func.end()

        # Look for a better insertion point (after existing hooks/consts)
        remaining = content[insert_pos:]
        existing_consts = re.finditer(r'^\s\s(const|let|var)\s+', remaining, re.MULTILINE)
        last_const_end = None
        for match in existing_consts:
            # Stop at first non-const/non-hook line
            if 'use' in remaining[match.start():match.end() + 100] or '=' in remaining[match.start():match.end() + 50]:
                last_const_end = insert_pos + match.end()
            else:
                break

        if last_const_end:
            insert_pos = last_const_end

        # Generate unique const declarations
        declarations = []
        var_map = {}

        for light_val, dark_val in set(hooks):  # Use set to get unique combinations
            var_name = generate_var_name(light_val, dark_val)

            # Ensure uniqueness
            base_name = var_name
            counter = 1
            while var_name in var_map.values():
                var_name = f"{base_name}{counter}"
                counter += 1

            var_map[(light_val, dark_val)] = var_name
            declarations.append(f'  const {var_name} = useColorModeValue("{light_val}", "{dark_val}")')

        if not declarations:
            return False, 0

        # Insert declarations
        insert_text = '\n' + '\n'.join(declarations) + '\n'

        # Find a good insertion point (look for newline after last const/hook)
        search_area = content[max(0, insert_pos-200):insert_pos+200]
        newline_match = re.search(r'\n\s*\n', search_area[100:])  # Look ahead
        if newline_match:
            insert_pos = insert_pos - 100 + newline_match.start() + 1

        content = content[:insert_pos] + insert_text + content[insert_pos:]

        # Replace inline calls with variable names
        for (light_val, dark_val), var_name in var_map.items():
            pattern = f'useColorModeValue\\([\'"]{ re.escape(light_val)}[\'"]\s*,\s*[\'"]{ re.escape(dark_val)}[\'"]\\)'
            content = re.sub(pattern, var_name, content)

        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, len(declarations)

        return False, 0

    except Exception as e:
        print(f"  ERR {os.path.basename(file_path)}: {e}")
        return False, 0

def main():
    if len(sys.argv) < 2:
        print("Usage: python fix-hooks.py <file1> <file2> ...")
        return 1

    files = sys.argv[1:]
    total = 0
    fixed = 0
    total_changes = 0

    print("\n>>> Fixing React Hooks Ordering Issues\n")
    print("=" * 70)

    for file_path in files:
        if not os.path.exists(file_path):
            continue

        total += 1
        modified, changes = fix_file(file_path)

        if modified:
            print(f"  OK {os.path.basename(file_path)}: {changes} hooks moved to top")
            fixed += 1
            total_changes += changes

    print("\n" + "=" * 70)
    print(f"\n>>> Complete: {fixed}/{total} files fixed, {total_changes} hooks moved\n")

    return 0

if __name__ == '__main__':
    sys.exit(main())

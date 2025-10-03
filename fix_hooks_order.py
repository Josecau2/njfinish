#!/usr/bin/env python3
"""
Script to fix React Hooks order violations by moving inline useColorModeValue calls
to the top of components (before useState hooks).
"""

import os
import re
from collections import defaultdict

def find_files_with_violations(src_dir):
    """Find all JSX files with useState and inline useColorModeValue violations."""
    files_to_fix = []

    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()

                    if 'useState' not in content:
                        continue

                    lines = content.split('\n')
                    first_usestate_line = None
                    first_inline_colormode = None

                    for i, line in enumerate(lines, 1):
                        if 'useState' in line and 'const [' in line and first_usestate_line is None:
                            first_usestate_line = i
                        # Check for inline useColorModeValue (not at variable declaration level)
                        if re.search(r'[\s<>={}]useColorModeValue\s*\(', line):
                            # Check if it's NOT a const declaration
                            if not re.match(r'^\s*const\s+\w+\s*=\s*useColorModeValue', line):
                                if first_inline_colormode is None:
                                    first_inline_colormode = i

                    if first_usestate_line and first_inline_colormode and first_inline_colormode > first_usestate_line:
                        files_to_fix.append(filepath)
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

    return files_to_fix

def extract_inline_color_calls(content):
    """Extract all inline useColorModeValue calls and generate variable names."""
    pattern = r'useColorModeValue\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)'
    matches = re.findall(pattern, content)

    # Create unique color combinations
    color_pairs = {}
    for light, dark in matches:
        key = (light, dark)
        if key not in color_pairs:
            # Generate a descriptive variable name
            var_name = generate_var_name(light, dark, color_pairs)
            color_pairs[key] = var_name

    return color_pairs

def generate_var_name(light, dark, existing_vars):
    """Generate a descriptive variable name for a color pair."""
    # Extract color base and value
    light_parts = light.split('.')
    dark_parts = dark.split('.')

    if len(light_parts) >= 2:
        color_base = light_parts[0]  # e.g., "gray", "blue"
        value = light_parts[1]  # e.g., "500", "50"

        # Determine type based on common patterns
        if color_base == "gray" and value in ["50", "100"]:
            prefix = "bg"
        elif color_base == "gray" and value in ["200", "600", "700"]:
            prefix = "border"
        elif color_base == "gray" and value in ["300", "400", "500"]:
            prefix = "icon"
        elif color_base == "gray" and value in ["600", "700"]:
            prefix = "text"
        elif "blue" in color_base or "green" in color_base or "red" in color_base:
            if value in ["50", "800", "900"]:
                prefix = "bg"
            elif value in ["300", "400", "500"]:
                prefix = "icon"
            elif value in ["600", "700"]:
                prefix = "text"
            else:
                prefix = "color"
        else:
            prefix = "color"

        # Create base name
        base_name = f"{prefix}{color_base.capitalize()}{value}"

        # Ensure uniqueness
        counter = 1
        var_name = base_name
        while var_name in existing_vars.values():
            var_name = f"{base_name}_{counter}"
            counter += 1

        return var_name

    # Fallback
    return f"color{len(existing_vars) + 1}"

def fix_file(filepath):
    """Fix a single file by moving useColorModeValue calls before useState."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract color pairs
        color_pairs = extract_inline_color_calls(content)

        if not color_pairs:
            return False

        # Find the component function and useState position
        lines = content.split('\n')
        component_start = None
        first_usestate_idx = None

        for i, line in enumerate(lines):
            # Find component function start
            if re.match(r'const\s+\w+\s*=\s*\(.*\)\s*=>\s*\{', line):
                component_start = i
            # Find first useState
            if 'useState' in line and 'const [' in line and first_usestate_idx is None and component_start is not None:
                first_usestate_idx = i
                break

        if first_usestate_idx is None or component_start is None:
            return False

        # Generate color mode declarations
        color_declarations = []
        color_declarations.append("")
        color_declarations.append("  // Color mode values")
        for (light, dark), var_name in color_pairs.items():
            color_declarations.append(f'  const {var_name} = useColorModeValue("{light}", "{dark}")')

        # Insert declarations before useState
        # Find the line right before useState (skip empty lines)
        insert_idx = first_usestate_idx
        while insert_idx > component_start and lines[insert_idx - 1].strip() == '':
            insert_idx -= 1

        # Insert color declarations
        for decl in reversed(color_declarations):
            lines.insert(insert_idx, decl)

        # Replace inline calls with variables
        modified_content = '\n'.join(lines)
        for (light, dark), var_name in color_pairs.items():
            pattern = f'useColorModeValue\\s*\\(\\s*"{re.escape(light)}"\\s*,\\s*"{re.escape(dark)}"\\s*\\)'
            modified_content = re.sub(pattern, var_name, modified_content)

        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(modified_content)

        return True

    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

def main():
    src_dir = r'c:\njtake2\njcabinets-main\frontend\src'

    print("Finding files with React Hooks order violations...")
    files_to_fix = find_files_with_violations(src_dir)

    print(f"\nFound {len(files_to_fix)} files with violations:")
    for f in files_to_fix:
        print(f"  {f}")

    print(f"\nFixing files...")
    fixed_count = 0
    for filepath in files_to_fix:
        if fix_file(filepath):
            fixed_count += 1
            print(f"  [OK] Fixed: {os.path.relpath(filepath, src_dir)}")
        else:
            print(f"  [SKIP] Skipped: {os.path.relpath(filepath, src_dir)}")

    print(f"\nSummary: Fixed {fixed_count} out of {len(files_to_fix)} files")

if __name__ == '__main__':
    main()

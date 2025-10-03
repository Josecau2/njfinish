#!/usr/bin/env python3
"""
Comprehensive script to eliminate ALL remaining Bootstrap from CatalogMappingTab.jsx
"""

import re
import sys

def fix_all_bootstrap(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    changes = []
    i = 0

    while i < len(lines):
        line = lines[i]
        original = line

        # Pattern 1: d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 p-3 bg-light rounded gap-2
        if '<div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 p-3 bg-light rounded gap-2"' in line:
            lines[i] = line.replace(
                '<div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 p-3 bg-light rounded gap-2"',
                '<Flex flexDir={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "start", sm: "center" }} mb={3} p={3} bg="gray.50" borderRadius="md" gap={2}'
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
            changes.append(f"Line {i+1}: Bulk actions container")

        # Pattern 2: d-flex align-items-center mb-3 p-3 bg-light rounded
        elif '<div className="d-flex align-items-center mb-3 p-3 bg-light rounded"' in line:
            lines[i] = line.replace(
                '<div className="d-flex align-items-center mb-3 p-3 bg-light rounded"',
                '<Flex align="center" mb={3} p={3} bg="gray.50" borderRadius="md"'
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
            changes.append(f"Line {i+1}: d-flex align-items-center mb-3 p-3 bg-light rounded")

        # Pattern 3: d-flex justify-content-between align-items-center mt-3
        elif '<div className="d-flex justify-content-between align-items-center mt-3"' in line:
            lines[i] = line.replace(
                '<div className="d-flex justify-content-between align-items-center mt-3"',
                '<Flex justify="space-between" align="center" mt={3}'
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
            changes.append(f"Line {i+1}: d-flex justify-content-between align-items-center mt-3")

        # Pattern 4: mb-3 d-flex align-items-center gap-2
        elif '<div className="mb-3 d-flex align-items-center gap-2"' in line:
            lines[i] = line.replace(
                '<div className="mb-3 d-flex align-items-center gap-2"',
                '<Flex mb={3} align="center" gap={2}'
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
            changes.append(f"Line {i+1}: mb-3 d-flex align-items-center gap-2")

        # Pattern 5: mt-3 d-flex gap-2
        elif '<div className="mt-3 d-flex gap-2"' in line:
            lines[i] = line.replace(
                '<div className="mt-3 d-flex gap-2"',
                '<Flex mt={3} gap={2}'
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
            changes.append(f"Line {i+1}: mt-3 d-flex gap-2")

        # Pattern 6: Text utilities - mt-2 text-muted small
        elif '<div className="mt-2 text-muted small"' in line:
            lines[i] = line.replace(
                '<div className="mt-2 text-muted small"',
                '<Text mt={2} color="gray.600" fontSize="sm"'
            )
            depth = 1
            j = i + 1
            while j < len(lines) and depth > 0:
                if '<div' in lines[j] and 'className=' in lines[j]:
                    depth += 1
                elif '</div>' in lines[j]:
                    depth -= 1
                    if depth == 0:
                        lines[j] = lines[j].replace('</div>', '</Text>', 1)
                        break
                j += 1
            changes.append(f"Line {i+1}: mt-2 text-muted small")

        # Pattern 7: mt-2 text-success
        elif '<div className="mt-2 text-success"' in line:
            lines[i] = line.replace(
                '<div className="mt-2 text-success"',
                '<Text mt={2} color="green.500"'
            )
            depth = 1
            j = i + 1
            while j < len(lines) and depth > 0:
                if '<div' in lines[j] and 'className=' in lines[j]:
                    depth += 1
                elif '</div>' in lines[j]:
                    depth -= 1
                    if depth == 0:
                        lines[j] = lines[j].replace('</div>', '</Text>', 1)
                        break
                j += 1
            changes.append(f"Line {i+1}: mt-2 text-success")

        # Pattern 8: mt-3 p-3 bg-light rounded
        elif '<div className="mt-3 p-3 bg-light rounded"' in line:
            lines[i] = line.replace(
                '<div className="mt-3 p-3 bg-light rounded"',
                '<Box mt={3} p={3} bg="gray.50" borderRadius="md"'
            )
            depth = 1
            j = i + 1
            while j < len(lines) and depth > 0:
                if '<div' in lines[j] and 'className=' in lines[j]:
                    depth += 1
                elif '</div>' in lines[j]:
                    depth -= 1
                    if depth == 0:
                        lines[j] = lines[j].replace('</div>', '</Box>', 1)
                        break
                j += 1
            changes.append(f"Line {i+1}: mt-3 p-3 bg-light rounded")

        # Pattern 9: border rounded p-3
        elif 'className="border rounded p-3"' in line:
            lines[i] = line.replace(
                'className="border rounded p-3"',
                'border="1px solid" borderColor="gray.300" borderRadius="md" p={3}'
            )
            changes.append(f"Line {i+1}: border rounded p-3")

        # Pattern 10: form-check mb-2
        elif '<div key=' in line and 'className="form-check mb-2"' in line:
            lines[i] = line.replace(
                'className="form-check mb-2"',
                'mb={2}'
            )
            changes.append(f"Line {i+1}: form-check mb-2")

        # Pattern 11: form-check-input me-2
        elif 'className="form-check-input me-2"' in line:
            lines[i] = line.replace(
                'className="form-check-input me-2"',
                'mr={2}'
            )
            changes.append(f"Line {i+1}: form-check-input me-2")

        # Pattern 12: form-check-label mb-0
        elif 'className="form-check-label mb-0"' in line:
            lines[i] = line.replace(
                'className="form-check-label mb-0"',
                'mb={0}'
            )
            changes.append(f"Line {i+1}: form-check-label mb-0")

        # Pattern 13: btn btn-outline-secondary btn-sm
        elif 'className="btn btn-outline-secondary btn-sm"' in line:
            lines[i] = line.replace(
                'className="btn btn-outline-secondary btn-sm"',
                'variant="outline" colorScheme="gray" size="sm"'
            )
            changes.append(f"Line {i+1}: btn btn-outline-secondary btn-sm")

        # Pattern 14: small className="fw-bold text-muted"
        elif '<small className="fw-bold text-muted"' in line:
            lines[i] = line.replace(
                '<small className="fw-bold text-muted"',
                '<Text fontSize="sm" fontWeight="bold" color="gray.600"'
            )
            # Find closing </small>
            depth = 1
            j = i + 1
            while j < len(lines) and depth > 0:
                if '<small' in lines[j]:
                    depth += 1
                elif '</small>' in lines[j]:
                    depth -= 1
                    if depth == 0:
                        lines[j] = lines[j].replace('</small>', '</Text>', 1)
                        break
                j += 1
            changes.append(f"Line {i+1}: small fw-bold text-muted")

        # Pattern 15: spinner-border text-primary mb-2
        elif 'className="spinner-border text-primary mb-2"' in line:
            lines[i] = line.replace(
                '<div className="spinner-border text-primary mb-2" role="status">',
                '<Spinner color="blue.500" mb={2}>'
            )
            # Find closing </div>
            depth = 1
            j = i + 1
            while j < len(lines) and depth > 0:
                if '<div' in lines[j] and 'className=' in lines[j]:
                    depth += 1
                elif '</div>' in lines[j]:
                    depth -= 1
                    if depth == 0:
                        lines[j] = lines[j].replace('</div>', '</Spinner>', 1)
                        break
                j += 1
            changes.append(f"Line {i+1}: spinner-border text-primary mb-2")

        if lines[i] != original:
            pass  # Already logged in changes

        i += 1

    # Write changes
    if changes:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print(f"[SUCCESS] Updated {filepath}")
        print(f"Total changes: {len(changes)}")
        for change in changes[:15]:
            print(f"  - {change}")
        if len(changes) > 15:
            print(f"  ... and {len(changes) - 15} more")
        return True
    else:
        print(f"No changes needed")
        return False

if __name__ == '__main__':
    filepath = 'frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx'
    success = fix_all_bootstrap(filepath)
    sys.exit(0 if success else 1)

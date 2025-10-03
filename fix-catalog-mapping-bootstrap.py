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

    # Track all changes for logging
    changes = []

    # Pattern 1: d-flex combinations with Bootstrap utilities
    patterns = [
        # d-flex with flex-column/row, justify, align, gap
        (r'<div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 p-3 bg-light rounded gap-2"',
         r'<Flex flexDir={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "start", sm: "center" }} mb={3} p={3} bg="gray.50" borderRadius="md" gap={2}',
         'Bulk actions container'),

        (r'<div className="d-flex gap-2 flex-shrink-0"',
         r'<Flex gap={2} flexShrink={0}',
         'd-flex gap-2 flex-shrink-0'),

        (r'<div className="d-flex flex-wrap gap-1"',
         r'<Flex flexWrap="wrap" gap={1}',
         'd-flex flex-wrap gap-1'),

        (r'<div className="d-flex align-items-center mb-3 p-3 bg-light rounded"',
         r'<Flex align="center" mb={3} p={3} bg="gray.50" borderRadius="md"',
         'd-flex align-items-center mb-3 p-3'),

        (r'<div className="d-flex justify-content-between align-items-center mt-3"',
         r'<Flex justify="space-between" align="center" mt={3}',
         'd-flex justify-content-between mt-3'),

        (r'<div className="mb-3 d-flex align-items-center gap-2"',
         r'<Flex mb={3} align="center" gap={2}',
         'mb-3 d-flex align-items-center'),

        (r'<div className="d-flex justify-content-between align-items-center mb-1"',
         r'<Flex justify="space-between" align="center" mb={1}',
         'd-flex justify-content-between mb-1'),

        (r'<div className="mt-3 d-flex gap-2"',
         r'<Flex mt={3} gap={2}',
         'mt-3 d-flex gap-2'),

        # Text utilities
        (r'<small className="fw-bold text-muted">',
         r'<Text fontSize="sm" fontWeight="bold" color="gray.600">',
         'small fw-bold text-muted'),

        (r'<p className="text-danger mt-3">',
         r'<Text color="red.500" mt={3}>',
         'text-danger mt-3'),

        (r'<div className="mt-2 text-muted small">',
         r'<Text mt={2} color="gray.600" fontSize="sm">',
         'mt-2 text-muted small'),

        (r'<div className="mt-2 text-success">',
         r'<Text mt={2} color="green.500">',
         'mt-2 text-success'),

        # Box/container patterns
        (r'<div className="mb-3 p-3 border rounded bg-light">',
         r'<Box mb={3} p={3} border="1px solid" borderColor="gray.300" borderRadius="md" bg="gray.50">',
         'mb-3 p-3 border rounded bg-light'),

        (r'<div className="mt-3 p-3 bg-light rounded">',
         r'<Box mt={3} p={3} bg="gray.50" borderRadius="md">',
         'mt-3 p-3 bg-light rounded'),

        (r'<div className="p-3 bg-light rounded">',
         r'<Box p={3} bg="gray.50" borderRadius="md">',
         'p-3 bg-light rounded'),

        (r'<div className="border rounded p-3 mb-3">',
         r'<Box border="1px solid" borderColor="gray.300" borderRadius="md" p={3} mb={3}>',
         'border rounded p-3 mb-3'),

        (r'<div className="border rounded p-3">',
         r'<Box border="1px solid" borderColor="gray.300" borderRadius="md" p={3}>',
         'border rounded p-3'),

        (r'<div className="p-3 bg-warning bg-opacity-10 rounded">',
         r'<Box p={3} bg="orange.50" borderRadius="md">',
         'p-3 bg-warning bg-opacity-10'),

        # Form elements
        (r'<div className="form-check mb-2">',
         r'<Box mb={2}>',
         'form-check mb-2'),

        (r'className="form-check-input me-2"',
         r'mr={2}',
         'form-check-input me-2'),

        (r'className="form-check-label mb-0"',
         r'mb={0}',
         'form-check-label mb-0'),

        # Buttons
        (r'className="btn btn-outline-secondary btn-sm"',
         r'variant="outline" colorScheme="gray" size="sm"',
         'btn btn-outline-secondary btn-sm'),

        # List styling
        (r'<ul className="mt-1 mb-0">',
         r'<Box as="ul" mt={1} mb={0}>',
         'ul mt-1 mb-0'),

        (r'<ul className="mt-2 mb-0">',
         r'<Box as="ul" mt={2} mb={0}>',
         'ul mt-2 mb-0'),

        # Row patterns
        (r'<div className="row mb-3">',
         r'<Box className="row" mb={3}>',
         'row mb-3'),

        # Alert
        (r'<div className="alert alert-info mt-3">',
         r'<Box bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="md" p={3} mt={3}>',
         'alert alert-info mt-3'),

        # Spinner
        (r'<div className="spinner-border text-primary mb-2" role="status">',
         r'<Spinner color="blue.500" mb={2}>',
         'spinner-border text-primary'),

        # Column with d-flex
        (r'<div className="col-md-3 d-flex align-items-end">',
         r'<Box className="col-md-3"><Flex align="flex-end">',
         'col-md-3 d-flex align-items-end'),

        # Background colors
        (r'className="bg-light"',
         r'bg="gray.50"',
         'bg-light standalone'),
    ]

    for pattern, replacement, desc in patterns:
        old_content = content
        content = re.sub(pattern, replacement, content)
        if content != old_content:
            count = old_content.count(pattern)
            changes.append(f"  ✓ Fixed {count} instance(s) of: {desc}")

    # Write changes
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[SUCCESS] Updated {filepath}")
        print(f"\nChanges made:")
        for change in changes:
            print(change)
        return True
    else:
        print(f"No changes needed in {filepath}")
        return False

if __name__ == '__main__':
    filepath = 'frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx'
    success = fix_bootstrap_in_catalog_mapping(filepath)
    sys.exit(0 if success else 1)

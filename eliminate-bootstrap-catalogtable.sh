#!/bin/bash

# Script to eliminate Bootstrap utility classes from CatalogTable.js
# This script carefully replaces Bootstrap classes while preserving closing tags

FILE="frontend/src/components/CatalogTable.js"

# First, add necessary Chakra imports (already done, but verify)
# Flex, Box, VStack, HStack should be in imports

# Replace d-flex patterns - CAREFULLY match opening and closing tags
# Pattern: <div className="d-flex ..."> ... </div> → <Flex ...> ... </Flex>

# 1. Simple d-flex with attributes
sed -i 's|<div className="d-flex flex-wrap gap-3 align-items-center justify-content-between|<Flex flexWrap="wrap" gap={3} align="center" justify="space-between"|g' "$FILE"

sed -i 's|<div className="d-flex flex-wrap align-items-center gap-3 flex-shrink-0">|<Flex flexWrap="wrap" align="center" gap={3} flexShrink={0}>|g' "$FILE"

sed -i 's|<div className="d-flex align-items-center gap-2">|<Flex align="center" gap={2}>|g' "$FILE"

sed -i 's|<div className="d-flex flex-column flex-md-row gap-4">|<Flex flexDir={{ base: "column", md: "row" }} gap={4}>|g' "$FILE"

sed -i 's|className="d-flex align-items-center gap-2 flex-wrap"|align="center" gap={2} flexWrap="wrap"|g' "$FILE"

sed -i 's|<div className="d-flex gap-1">|<Flex gap={1}>|g' "$FILE"

sed -i 's|<div className="d-flex align-items-center">|<Flex align="center">|g' "$FILE"

sed -i 's|<div className="d-flex align-items-center flex-wrap gap-2">|<Flex align="center" flexWrap="wrap" gap={2}>|g' "$FILE"

sed -i 's|<div className="mt-1 d-flex flex-wrap gap-1">|<Flex mt={1} flexWrap="wrap" gap={1}>|g' "$FILE"

# Replace margin/padding utilities
sed -i 's|className="mt-5 mb-5"|mt={5} mb={5}|g' "$FILE"
sed -i 's|className="mb-4 |mb={4} className="|g' "$FILE"
sed -i 's|className="mb-2 |mb={2} className="|g' "$FILE"
sed -i 's|className="mb-3 |mb={3} className="|g' "$FILE"
sed -i 's|className="mt-3 |mt={3} className="|g' "$FILE"

# Replace text utilities
sed -i 's|className="text-muted |color="gray.600" className="|g' "$FILE"
sed -i 's|className="text-danger |color="red.500" className="|g' "$FILE"

# Replace badge utilities
sed -i 's|className="badge text-bg-secondary|colorScheme="gray" className="badge|g' "$FILE"

echo "Bootstrap elimination complete for CatalogTable.js"
echo "Please check the file and run build to verify"

#!/bin/bash
# INVESTIGATE ALL CHAKRA COMPONENT USAGE

echo "=== CHAKRA COMPONENT INVESTIGATION ==="
echo ""

cd frontend/src

# List of all common Chakra components
components=(
  "Box" "Flex" "Grid" "Stack" "VStack" "HStack"
  "Button" "IconButton" "ButtonGroup"
  "Input" "Textarea" "Select" "Checkbox" "Radio" "Switch"
  "Table" "Thead" "Tbody" "Tr" "Th" "Td" "TableContainer"
  "Modal" "ModalOverlay" "ModalContent" "ModalHeader" "ModalBody" "ModalFooter"
  "Drawer" "DrawerOverlay" "DrawerContent" "DrawerHeader" "DrawerBody"
  "Menu" "MenuButton" "MenuList" "MenuItem"
  "Popover" "PopoverTrigger" "PopoverContent" "PopoverBody"
  "Card" "CardHeader" "CardBody" "CardFooter"
  "Alert" "AlertIcon" "AlertTitle" "AlertDescription"
  "Badge" "Tag" "Spinner" "Skeleton"
  "Text" "Heading" "Code"
  "Divider" "Spacer"
  "Container" "Center" "SimpleGrid"
  "Accordion" "AccordionItem" "AccordionButton" "AccordionPanel"
  "Tabs" "TabList" "Tab" "TabPanels" "TabPanel"
  "Tooltip" "Toast"
  "FormControl" "FormLabel" "FormHelperText" "FormErrorMessage"
  "InputGroup" "InputLeftAddon" "InputRightAddon" "InputLeftElement" "InputRightElement"
)

echo "Components with potential color issues:"
echo "========================================"

for comp in "${components[@]}"; do
  count=$(grep -r "<$comp " --include="*.jsx" --include="*.js" | \
    grep -E 'bg="|color="|borderColor="' | \
    grep -v useColorModeValue | \
    wc -l)

  if [ "$count" -gt 0 ]; then
    echo "$comp: $count instances with hardcoded colors"
  fi
done

echo ""
echo "=== COMPONENT INVESTIGATION COMPLETE ==="

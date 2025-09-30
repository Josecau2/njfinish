#!/usr/bin/env python3
"""Replace CoreUI components with Chakra equivalents in one or more files."""
from __future__ import annotations

import argparse
import re
from pathlib import Path

COMPONENT_MAP = {
    "CButton": "Button",
    "CButtonGroup": "ButtonGroup",
    "CBadge": "Badge",
    "CCard": "Card",
    "CCardBody": "CardBody",
    "CCardHeader": "CardHeader",
    "CCardFooter": "CardFooter",
    "CSpinner": "Spinner",
    "CAlert": "Alert",
    "CAlertHeading": "AlertTitle",
    "CAlertLink": "Alert",
    "CContainer": "Container",
    "CTable": "Table",
    "CTableHead": "Thead",
    "CTableBody": "Tbody",
    "CTableRow": "Tr",
    "CTableHeaderCell": "Th",
    "CTableDataCell": "Td",
    "CInputGroup": "InputGroup",
    "CInputGroupText": "InputLeftAddon",
    "CFormInput": "Input",
    "CFormTextarea": "Textarea",
    "CFormLabel": "FormLabel",
    "CFormText": "FormHelperText",
    "CFormSelect": "Select",
    "CFormCheck": "Checkbox",
    "CDropdown": "Menu",
    "CDropdownToggle": "MenuButton",
    "CDropdownMenu": "MenuList",
    "CDropdownItem": "MenuItem",
    "CAccordion": "Accordion",
    "CAccordionItem": "AccordionItem",
    "CAccordionHeader": "AccordionButton",
    "CAccordionBody": "AccordionPanel",
    "CRow": "SimpleGrid",
    "CCol": "Box",
    "CForm": "form",
}

IMPORT_PATTERN = re.compile(r"import\s+\{([^}]+)\}\s+from\s+'@coreui/react';?")
LINE_ENDING_PATTERN = re.compile(r"\r\n|\n|\r")


def derive_line_ending(text: str) -> str:
    matches = LINE_ENDING_PATTERN.findall(text)
    if matches:
        return matches[0]
    return "\n"


def replace_tags(source: str) -> str:
    for core, chakra in COMPONENT_MAP.items():
        source = re.sub(rf"<{core}(\s|>)", rf"<{chakra}\1", source)
        source = re.sub(rf"</{core}>", rf"</{chakra}>", source)
    return source


def update_imports(source: str) -> str:
    match = IMPORT_PATTERN.search(source)
    if not match:
        return source

    coreui_components = {name.strip() for name in match.group(1).split(",")}
    chakra_components = {COMPONENT_MAP[c] for c in coreui_components if c in COMPONENT_MAP and COMPONENT_MAP[c] not in {'form'}}

    # remove original line
    source = source[:match.start()] + source[match.end():]

    if chakra_components:
        line_end = derive_line_ending(source)
        new_import = f"import {{ {', '.join(sorted(chakra_components))} }} from '@chakra-ui/react';" + line_end
        # insert after first block of imports
        import_block = re.search(r"(import .+?;\s*)+", source)
        if import_block:
            insertion = import_block.end()
            source = source[:insertion] + new_import + source[insertion:]
        else:
            source = new_import + source
    return source


def process_file(path: Path, dry_run: bool = False) -> None:
    original = path.read_text(encoding='utf-8')
    updated = update_imports(original)
    updated = replace_tags(updated)
    if updated != original and not dry_run:
        path.write_text(updated, encoding='utf-8')
        print(f"Updated {path}")
    elif updated != original:
        print(f"[DRY RUN] Would update {path}")
    else:
        print(f"No changes needed in {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description='Convert CoreUI components to Chakra UI equivalents.')
    parser.add_argument('files', nargs='+', type=Path)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    for file_path in args.files:
        if not file_path.exists():
            print(f"Skipping {file_path}; not found")
            continue
        process_file(file_path, dry_run=args.dry_run)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Scan project files and detect React components that are not 100% Chakra UI."""

from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass, field
from typing import Dict, List

RAW_HTML_TAGS = [
    'div', 'span', 'section', 'main', 'header', 'footer', 'nav', 'ul', 'ol', 'li', 'button', 'table',
    'thead', 'tbody', 'tr', 'th', 'td', 'form', 'input', 'label', 'select', 'textarea',
    'img', 'p', 'strong', 'em', 'small', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'article', 'aside',
    'figure', 'figcaption', 'fieldset', 'legend', 'datalist', 'details', 'summary', 'canvas',
    'video', 'audio', 'iframe', 'pre', 'code', 'blockquote', 'q', 'sup', 'sub', 'br', 'hr'
]
RAW_TAG_PATTERN = re.compile(r'<\s*(%s)(?=[\s>/])' % '|'.join(RAW_HTML_TAGS))
CLASSNAME_PATTERN = re.compile(r'\bclassName\s*=')
INLINE_STYLE_PATTERN = re.compile(r'\bstyle\s*=\s*\{')
CHAKRA_IMPORT_PATTERN = re.compile(r"@chakra-ui/(?:react|icons)")

NON_CHAKRA_PACKAGES = [
    'sweetalert2',
    'simplebar-react',
    'react-bootstrap',
    'reactstrap',
    '@mui/',
    '@material-ui/',
    'antd',
    'semantic-ui-react',
    'primereact',
    'react-select',
    'bootstrap',
    '@headlessui/react',
    'yet-another-react-lightbox',
    'react-lazy-load-image-component',
    'react-data-table-component',
    'react-icons',
    '@heroicons/',
    '@fortawesome/',
    '@phosphor-icons/',
    'phosphor-react',
    'tabler-icons-react',
    'ionicons',
    '@iconify/',
    'feather-icons',
]
NON_CHAKRA_IMPORT_PATTERN = re.compile(
    r"import[^;]+from\s+['\"]([^'\"]+)['\"]|require\(\s*['\"]([^'\"]+)['\"]\s*\)"
)

COMPONENT_LIKE_PATTERN = re.compile(
    r"(function\s+[A-Z][A-Za-z0-9_]*\s*\(|"
    r"const\s+[A-Z][A-Za-z0-9_]*\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function))",
    re.MULTILINE,
)
RETURN_JSX_PATTERN = re.compile(r'return\s*\(.*<', re.DOTALL)

SUPPORTED_EXTENSIONS = ('.js', '.jsx', '.ts', '.tsx')

EXCLUDED_PATH_PREFIXES = [
    'components/pdf/',
]

EXCLUDED_FILE_PATHS = {
    'components/model/PrintPaymentReceiptModal.jsx',
    'helpers/generateContractHtml.js',
}

@dataclass
class FileAnalysis:
    path: str
    has_chakra_import: bool
    raw_tags: List[str]
    classnames: int
    inline_styles: int
    non_chakra_imports: List[str]
    looks_like_component: bool
    status: str
    reasons: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, object]:
        return {
            'path': self.path,
            'has_chakra_import': self.has_chakra_import,
            'raw_tags': self.raw_tags,
            'classnames': self.classnames,
            'inline_styles': self.inline_styles,
            'non_chakra_imports': self.non_chakra_imports,
            'looks_like_component': self.looks_like_component,
            'status': self.status,
            'reasons': self.reasons,
        }


def detect_non_chakra_components(root: str) -> List[FileAnalysis]:
    results: List[FileAnalysis] = []

    for dirpath, dirnames, filenames in os.walk(root):
        if 'node_modules' in dirpath.split(os.sep):
            continue
        for filename in filenames:
            if not filename.endswith(SUPPORTED_EXTENSIONS):
                continue
            full_path = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(full_path, root)
            rel_path = rel_path.replace('\\', '/')
            if any(rel_path.startswith(prefix) for prefix in EXCLUDED_PATH_PREFIXES) or rel_path in EXCLUDED_FILE_PATHS:
                continue
            try:
                with open(full_path, 'r', encoding='utf-8') as fh:
                    text = fh.read()
            except UnicodeDecodeError:
                with open(full_path, 'r', encoding='latin-1') as fh:
                    text = fh.read()

            has_chakra = bool(CHAKRA_IMPORT_PATTERN.search(text))
            raw_tags = sorted(set(tag.lower() for tag in RAW_TAG_PATTERN.findall(text)))
            classnames = len(CLASSNAME_PATTERN.findall(text))
            inline_styles = len(INLINE_STYLE_PATTERN.findall(text))

            non_chakra_imports: List[str] = []
            for match in NON_CHAKRA_IMPORT_PATTERN.findall(text):
                candidate = match[0] or match[1]
                for prefix in NON_CHAKRA_PACKAGES:
                    if candidate.startswith(prefix):
                        non_chakra_imports.append(candidate)
                        break
            non_chakra_imports = sorted(set(non_chakra_imports))

            looks_like_component = bool(
                COMPONENT_LIKE_PATTERN.search(text) and RETURN_JSX_PATTERN.search(text)
            )

            reasons: List[str] = []
            status: str

            if not has_chakra:
                status = 'no_chakra'
                reasons.append('missing @chakra-ui/react import')
            else:
                issues: List[str] = []
                if raw_tags:
                    issues.append('raw_html_tags')
                if classnames:
                    issues.append('className_usage')
                if inline_styles:
                    issues.append('inline_style_usage')
                if non_chakra_imports:
                    issues.append('non_chakra_library_import')

                if issues:
                    status = 'mixed'
                    reasons.extend(issues)
                else:
                    status = 'chakra_only'

            results.append(
                FileAnalysis(
                    path=rel_path.replace('\\', '/'),
                    has_chakra_import=has_chakra,
                    raw_tags=raw_tags,
                    classnames=classnames,
                    inline_styles=inline_styles,
                    non_chakra_imports=non_chakra_imports,
                    looks_like_component=looks_like_component,
                    status=status,
                    reasons=reasons,
                )
            )
    return results


def build_summary(analyses: List[FileAnalysis]) -> Dict[str, int]:
    summary: Dict[str, int] = {'total': len(analyses)}
    for status in ('chakra_only', 'mixed', 'no_chakra'):
        summary[status] = sum(1 for a in analyses if a.status == status)
    summary['components_flagged'] = sum(
        1 for a in analyses if a.status != 'chakra_only' and a.looks_like_component
    )
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description='Detect non-Chakra React components')
    parser.add_argument('--root', default='frontend/src', help='Directory to scan (default: frontend/src)')
    parser.add_argument('--json', action='store_true', help='Output JSON instead of human summary')
    parser.add_argument(
        '--include-all',
        action='store_true',
        help='Include files that do not look like React components in the summary',
    )
    args = parser.parse_args()

    analyses = detect_non_chakra_components(args.root)
    if args.json:
        payload = {
            'summary': build_summary(analyses),
            'files': [a.to_dict() for a in analyses],
        }
        print(json.dumps(payload, indent=2))
        return

    summary = build_summary(analyses)
    print('Chakra UI component audit summary')
    print('-' * 40)
    for key in ('total', 'chakra_only', 'mixed', 'no_chakra', 'components_flagged'):
        print(f"{key:20s}: {summary.get(key, 0)}")
    print('\nFlagged components:')
    print('-' * 40)

    for analysis in analyses:
        if analysis.status == 'chakra_only':
            continue
        if not args.include_all and not analysis.looks_like_component:
            continue
        reasons = ', '.join(analysis.reasons) or 'unknown'
        print(f"{analysis.status:10s} | {analysis.path} | reasons: {reasons}")


if __name__ == '__main__':
    main()






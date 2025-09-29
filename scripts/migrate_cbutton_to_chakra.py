#!/usr/bin/env python3
import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Optional, Tuple

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_SRC = PROJECT_ROOT / 'frontend' / 'src'

BASE_COLOR_MAP = {
    'primary': 'brand',
    'secondary': 'slate',
    'success': 'green',
    'danger': 'red',
    'warning': 'yellow',
    'info': 'blue',
    'light': 'gray',
    'dark': 'gray',
}

VARIANT_COLOR_MAP = {
    'outline-primary': ('outline', 'brand'),
    'outline-secondary': ('outline', 'slate'),
    'outline-success': ('outline', 'green'),
    'outline-danger': ('outline', 'red'),
    'outline-warning': ('outline', 'yellow'),
    'outline-info': ('outline', 'blue'),
}

BUTTON_OPEN_RE = re.compile(r'<CButton(?P<attrs>[^>]*)>', re.MULTILINE)
BUTTON_CLOSE_RE = re.compile(r'</CButton\s*>')
COREUI_IMPORT_RE = re.compile(r"import\s+\{(?P<spec>[^}]*)\}\s+from\s+['\"]@coreui/react['\"];?", re.MULTILINE)
CHAKRA_IMPORT_RE = re.compile(r"import\s+\{(?P<spec>[^}]*)\}\s+from\s+['\"]@chakra-ui/react['\"];?", re.MULTILINE)

class AttrToken:
    __slots__ = ('type', 'name', 'value_type', 'value', 'quote')

    def __init__(self, *, type: str, name: Optional[str] = None, value_type: Optional[str] = None,
                 value: Optional[str] = None, quote: str = '\"'):
        self.type = type
        self.name = name
        self.value_type = value_type
        self.value = value
        self.quote = quote

    def clone(self) -> 'AttrToken':
        return AttrToken(type=self.type, name=self.name, value_type=self.value_type,
                         value=self.value, quote=self.quote)

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        if self.type == 'whitespace':
            return f"WS({self.value!r})"
        if self.value_type == 'literal':
            return f"ATTR({self.name}='{self.value}')"
        if self.value_type == 'expr':
            return f"ATTR({self.name}={{...}})"
        if self.value_type == 'boolean':
            return f"ATTR({self.name})"
        return f"ATTR({self.name}={self.value})"


def parse_tokens(attr_str: str) -> List[AttrToken]:
    tokens: List[AttrToken] = []
    i = 0
    length = len(attr_str)

    while i < length:
        ch = attr_str[i]
        if ch.isspace():
            j = i + 1
            while j < length and attr_str[j].isspace():
                j += 1
            tokens.append(AttrToken(type='whitespace', value_type=None, value=attr_str[i:j]))
            i = j
            continue

        # read attribute name or trailing slash
        if ch == '/':
            tokens.append(AttrToken(type='literal', name='/', value_type='bare', value='/'))
            i += 1
            continue

        j = i
        while j < length and attr_str[j] not in ['=', ' ', '\t', '\n', '\r']:
            j += 1
        name = attr_str[i:j]
        k = j
        while k < length and attr_str[k].isspace():
            k += 1

        if k < length and attr_str[k] == '=':
            k += 1
            while k < length and attr_str[k].isspace():
                k += 1
            if k >= length:
                tokens.append(AttrToken(type='attr', name=name, value_type='boolean'))
                i = k
                continue
            if attr_str[k] in ('"', "'"):
                quote = attr_str[k]
                k += 1
                val_start = k
                while k < length:
                    if attr_str[k] == quote:
                        break
                    if attr_str[k] == '\\' and k + 1 < length:
                        k += 2
                        continue
                    k += 1
                value = attr_str[val_start:k]
                if k < length:
                    k += 1
                tokens.append(AttrToken(type='attr', name=name, value_type='literal', value=value, quote=quote))
                i = k
                continue
            if attr_str[k] == '{':
                depth = 1
                k += 1
                val_start = k
                while k < length and depth > 0:
                    if attr_str[k] == '{':
                        depth += 1
                    elif attr_str[k] == '}':
                        depth -= 1
                    k += 1
                value = attr_str[val_start:k-1] if depth == 0 else attr_str[val_start:k]
                tokens.append(AttrToken(type='attr', name=name, value_type='expr', value=value))
                i = k
                continue
            # bare value
            val_start = k
            while k < length and not attr_str[k].isspace():
                k += 1
            value = attr_str[val_start:k]
            tokens.append(AttrToken(type='attr', name=name, value_type='bare', value=value))
            i = k
            continue

        # boolean attribute (no value)
        tokens.append(AttrToken(type='attr', name=name, value_type='boolean'))
        i = k

    return tokens


def tokens_to_string(tokens: List[AttrToken]) -> str:
    pieces: List[str] = []
    for token in tokens:
        if token.type == 'whitespace':
            pieces.append(token.value or '')
            continue
        if token.type == 'attr':
            if token.value_type == 'literal':
                quote = token.quote or '"'
                pieces.append(f"{token.name}={quote}{token.value}{quote}")
            elif token.value_type == 'expr':
                pieces.append(f"{token.name}={{" + (token.value or '') + "}}")
            elif token.value_type == 'bare':
                pieces.append(f"{token.name}={token.value}")
            elif token.value_type == 'boolean':
                pieces.append(f"{token.name}")
        elif token.type == 'literal' and token.name == '/':
            pieces.append('/')
    return ''.join(pieces)


def ensure_attr_separation(tokens: List[AttrToken]) -> List[AttrToken]:
    if not tokens:
        return tokens
    result: List[AttrToken] = []
    for token in tokens:
        if result and result[-1].type == 'attr' and token.type == 'attr':
            result.append(AttrToken(type='whitespace', value_type=None, value=' '))
        result.append(token)
    return result


def insert_attrs(tokens: List[AttrToken], index: int, new_attrs: List[AttrToken]) -> None:
    if not new_attrs:
        return
    expanded: List[AttrToken] = []
    for idx, attr in enumerate(new_attrs):
        if idx > 0:
            expanded.append(AttrToken(type='whitespace', value_type=None, value=' '))
        expanded.append(attr)
    tokens[index:index] = expanded


def map_coreui_color(color_value: str, existing_variant: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """Return (new_variant, color_scheme)."""
    if not color_value:
        return None, None

    lowered = color_value.strip().lower()
    if lowered.startswith('outline-'):
        base = lowered[len('outline-'):]
        color_scheme = BASE_COLOR_MAP.get(base, 'brand')
        return 'outline', color_scheme
    if lowered == 'ghost':
        color_scheme = 'brand'
        if existing_variant in (None, '', 'solid'):
            return 'ghost', color_scheme
        return None, color_scheme
    if lowered == 'light':
        color_scheme = 'gray'
        if existing_variant in (None, '', 'solid'):
            return 'outline', color_scheme
        return None, color_scheme
    base_scheme = BASE_COLOR_MAP.get(lowered)
    if base_scheme:
        return None, base_scheme
    return None, 'brand'


def build_literal_attr(name: str, value: str) -> AttrToken:
    return AttrToken(type='attr', name=name, value_type='literal', value=value, quote='"')


def transform_attr_string(attr_string: str, issues: List[str], context: str) -> str:
    if not attr_string:
        return attr_string

    attrs = attr_string
    trailing = ''
    stripped = attrs.rstrip()
    if stripped.endswith('/'):
        idx = attrs.rfind('/')
        trailing = attrs[idx:]
        attrs = attrs[:idx]
    else:
        trailing = attrs[len(stripped):]
        attrs = stripped

    tokens = parse_tokens(attrs)
    tokens = ensure_attr_separation(tokens)

    variant_idx = next((i for i, tok in enumerate(tokens) if tok.type == 'attr' and tok.name == 'variant'), None)
    variant_value: Optional[str] = None
    color_scheme_hint: Optional[str] = None

    if variant_idx is not None:
        variant_token = tokens[variant_idx]
        if variant_token.value_type == 'literal' and variant_token.value:
            variant_literal = variant_token.value
            if variant_literal in VARIANT_COLOR_MAP:
                new_variant, scheme = VARIANT_COLOR_MAP[variant_literal]
                tokens[variant_idx].value = new_variant
                variant_value = new_variant
                color_scheme_hint = scheme
            else:
                variant_value = variant_literal
        elif variant_token.value_type == 'expr':
            variant_value = None
        else:
            variant_value = None

    color_idx = next((i for i, tok in enumerate(tokens) if tok.type == 'attr' and tok.name == 'color'), None)
    color_scheme: Optional[str] = None
    desired_variant: Optional[str] = None

    if color_idx is not None:
        color_token = tokens[color_idx]
        if color_token.value_type == 'literal':
            literal_value = color_token.value or ''
            existing_variant = None
            if variant_idx is not None and tokens[variant_idx].value_type == 'literal':
                existing_variant = tokens[variant_idx].value
            desired_variant, color_scheme = map_coreui_color(literal_value, existing_variant)
            # remove color token but keep surrounding whitespace
            tokens.pop(color_idx)
        elif color_token.value_type == 'expr':
            issues.append(f"{context}: color expression '{color_token.value}' requires manual mapping")
            # leave expression for manual fix later
        else:
            tokens.pop(color_idx)

    if desired_variant and variant_idx is None:
        # insert new variant attribute near previous color position if available
        insert_position = color_idx if color_idx is not None else len(tokens)
        insert_attrs(tokens, insert_position, [build_literal_attr('variant', desired_variant)])
        # ensure our newly inserted variant index for further steps
        variant_idx = next((i for i, tok in enumerate(tokens) if tok.type == 'attr' and tok.name == 'variant'), None)
    elif desired_variant and variant_idx is not None:
        if tokens[variant_idx].value_type == 'literal':
            tokens[variant_idx].value = desired_variant

    if color_scheme is None:
        color_scheme = color_scheme_hint

    # ensure colorScheme attribute exists when we have a scheme determined
    if color_scheme:
        color_scheme_attr_idx = next((i for i, tok in enumerate(tokens) if tok.type == 'attr' and tok.name == 'colorScheme'), None)
        insert_position = color_idx if color_idx is not None else (variant_idx + 1 if variant_idx is not None else len(tokens))
        if color_scheme_attr_idx is not None:
            tokens[color_scheme_attr_idx].value = color_scheme
        else:
            insert_attrs(tokens, max(insert_position, 0), [build_literal_attr('colorScheme', color_scheme)])

    tokens = ensure_attr_separation(tokens)
    rebuilt = tokens_to_string(tokens)
    return rebuilt + trailing


def transform_button_tags(content: str, issues: List[str], path: Path) -> str:
    def _repl(match: re.Match) -> str:
        attrs = match.group('attrs')
        new_attrs = transform_attr_string(attrs, issues, context=f"{path}:{match.start()}" )
        return '<Button' + new_attrs + '>'

    return BUTTON_OPEN_RE.sub(_repl, content)


def transform_closing_tags(content: str) -> str:
    return BUTTON_CLOSE_RE.sub('</Button>', content)


def remove_cbutton_imports(content: str) -> str:
    def _repl(match: re.Match) -> str:
        spec = match.group('spec')
        parts = [part.strip() for part in spec.split(',') if part.strip()]
        filtered = [part for part in parts if part != 'CButton']
        if not filtered:
            leading = ''
            trailing = '\n' if match.group(0).endswith('\n') else ''
            return leading + trailing
        if '\n' in spec:
            inner_lines = ['  ' + name + ',' for name in filtered]
            joined = '\n'.join(inner_lines)
            semicolon = ';' if match.group(0).strip().endswith(';') else ''
            return f"import {{\n{joined}\n}} from '@coreui/react'{semicolon}"
        joined = ', '.join(filtered)
        semicolon = ';' if match.group(0).strip().endswith(';') else ''
        return f"import {{ {joined} }} from '@coreui/react'{semicolon}"

    return COREUI_IMPORT_RE.sub(_repl, content)


def ensure_chakra_import(content: str) -> str:
    def add_button(spec: str) -> str:
        parts = [part.strip() for part in spec.split(',') if part.strip()]
        if 'Button' in parts:
            return spec
        parts.append('Button')
        return ', '.join(sorted(set(parts), key=lambda x: parts.index(x)))

    match = CHAKRA_IMPORT_RE.search(content)
    if match:
        spec = match.group('spec')
        updated_spec = add_button(spec)
        if updated_spec == spec:
            return content
        start, end = match.span('spec')
        return content[:start] + updated_spec + content[end:]

    # insert new import after last existing import
    new_import = "import { Button } from '@chakra-ui/react'\n"
    import_iter = list(re.finditer(r'^import\s.+$', content, flags=re.MULTILINE))
    if import_iter:
        last = import_iter[-1]
        insert_pos = last.end()
        return content[:insert_pos] + '\n' + new_import + content[insert_pos:]
    return new_import + '\n' + content


def process_file(path: Path, issues: List[str]) -> bool:
    original = path.read_text(encoding='utf-8')
    updated = original
    if 'CButton' not in updated:
        return False

    updated = remove_cbutton_imports(updated)
    updated = ensure_chakra_import(updated)
    updated = transform_button_tags(updated, issues, path)
    updated = transform_closing_tags(updated)

    if updated != original:
        path.write_text(updated, encoding='utf-8')
        return True
    return False


def main() -> None:
    paths: List[Path] = []
    if not FRONTEND_SRC.exists():
        print('frontend/src directory not found', file=sys.stderr)
        sys.exit(1)

    for ext in ('*.js', '*.jsx', '*.ts', '*.tsx'):
        paths.extend(FRONTEND_SRC.rglob(ext))

    updated_count = 0
    issues: List[str] = []

    for path in paths:
        if not path.is_file():
            continue
        modified = process_file(path, issues)
        if modified:
            updated_count += 1

    print(f"Updated {updated_count} files.")
    if issues:
        print('\nManual follow-up required:')
        for item in issues:
            print(' -', item)


if __name__ == '__main__':
    main()

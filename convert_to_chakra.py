#!/usr/bin/env python3
import re
import sys

def convert_html_to_chakra(content):
    """Convert HTML elements to Chakra UI components"""

    # Track replacements for summary
    replacements = {
        'div': 0,
        'span': 0,
        'h1': 0,
        'h2': 0,
        'h3': 0,
        'h4': 0,
        'h5': 0,
        'h6': 0,
    }

    # Helper function to replace tags
    def replace_tag(content, old_tag, new_tag, props_mapper=None):
        count = 0
        # Match opening tags with or without attributes
        pattern = f'<{old_tag}([^>]*)>'

        def replacer(match):
            nonlocal count
            count += 1
            attrs = match.group(1).strip()

            # Apply props mapper if provided
            if props_mapper and attrs:
                attrs = props_mapper(attrs)

            if attrs:
                return f'<{new_tag} {attrs}>'
            return f'<{new_tag}>'

        content = re.sub(pattern, replacer, content)
        # Replace closing tags
        content = content.replace(f'</{old_tag}>', f'</{new_tag}>')
        return content, count

    # Convert div elements
    # First handle divs with style attributes that need conversion
    def convert_div_style(attrs):
        # Check if it has flexbox properties
        if 'style=' in attrs:
            # Extract style content
            style_match = re.search(r'style=\{?\{([^}]+)\}\}?', attrs)
            if style_match:
                style_content = style_match.group(1)
                # Check for flex properties
                if 'display: \'flex\'' in style_content or 'display:"flex"' in style_content or 'flexDirection' in style_content:
                    # Remove style attribute and add display="flex"
                    attrs = re.sub(r'style=\{?\{[^}]+\}\}?', '', attrs)
                    # We'll convert to Flex later
                    attrs = attrs + ' __flex__'
        return attrs

    # First pass: mark flex divs
    content = re.sub(r'<div([^>]*style=\{?\{[^}]*display:\s*[\'"]flex[\'"][^}]*\}\}?[^>]*)>',
                     lambda m: '<div' + convert_div_style(m.group(1)) + '>', content)

    # Replace divs with __flex__ marker with Flex
    content = re.sub(r'<div([^>]*__flex__[^>]*)>',
                     lambda m: '<Flex' + m.group(1).replace('__flex__', '').strip() + '>', content)

    # Replace remaining divs with Box
    content, div_count = replace_tag(content, 'div', 'Box')
    replacements['div'] = div_count

    # Convert span elements to Text as="span"
    def convert_span(attrs):
        if attrs:
            return f'as="span" {attrs}'
        return 'as="span"'

    # Handle spans - check if they have role or are emoji
    content = re.sub(r'<span([^>]*)>([^<]*)</span>',
                     lambda m: f'<Text as="span"{m.group(1)}>{m.group(2)}</Text>' if m.group(2) and not re.match(r'^[✏️🗑️\s]*$', m.group(2)) else f'<Text as="span"{m.group(1)}>{m.group(2)}</Text>',
                     content)
    replacements['span'] = content.count('</Text>')

    # Convert heading elements
    heading_map = {
        'h1': '2xl',
        'h2': 'xl',
        'h3': 'lg',
        'h4': 'md',
        'h5': 'sm',
        'h6': 'xs'
    }

    for heading, size in heading_map.items():
        def convert_heading(attrs):
            if attrs:
                return f'size="{size}" {attrs}'
            return f'size="{size}"'

        pattern = f'<{heading}([^>]*)>'
        matches = re.findall(pattern, content)
        replacements[heading] = len(matches)

        content = re.sub(pattern,
                         lambda m: f'<Heading size="{size}"{m.group(1) if m.group(1) else ""}>',
                         content)
        content = content.replace(f'</{heading}>', '</Heading>')

    return content, replacements

def main():
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'CatalogMappingTab.jsx'

    # Read the file
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Convert HTML to Chakra
    converted_content, replacements = convert_html_to_chakra(content)

    # Write back
    with open(input_file, 'w', encoding='utf-8') as f:
        f.write(converted_content)

    # Print summary
    print("Conversion Summary:")
    print(f"  div → Box/Flex: {replacements['div']}")
    print(f"  span → Text: {replacements['span']}")
    for i in range(1, 7):
        h = f'h{i}'
        if replacements[h] > 0:
            print(f"  {h} → Heading: {replacements[h]}")

    total = sum(replacements.values())
    print(f"\nTotal replacements: {total}")

if __name__ == '__main__':
    main()

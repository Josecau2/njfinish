#!/bin/bash
cd frontend/src

# Fix fontSize= in style objects (but NOT in JSX props)
# This pattern looks for style={{...fontSize="..."...}}
find . \( -name "*.jsx" -o -name "*.js" \) -not -path "*/node_modules/*" -exec sed -i 's/\(style={{[^}]*\)fontSize="\([^"]*\)"/\1fontSize: "\2"/g' {} \;

# Fix color= in style objects
find . \( -name "*.jsx" -o -name "*.js" \) -not -path "*/node_modules/*" -exec sed -i 's/\(style={{[^}]*\)color="\([^"]*\)"/\1color: "\2"/g' {} \;

# Fix fontSize= and color= in sx objects
find . \( -name "*.jsx" -o -name "*.js" \) -not -path "*/node_modules/*" -exec sed -i 's/\(sx={{[^}]*\)fontSize="\([^"]*\)"/\1fontSize: "\2"/g' {} \;
find . \( -name "*.jsx" -o -name "*.js" \) -not -path "*/node_modules/*" -exec sed -i 's/\(sx={{[^}]*\)color="\([^"]*\)"/\1color: "\2"/g' {} \;

echo "Done!"

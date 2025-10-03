import re
from pathlib import Path

patterns = {"container", "row", "col", "d-flex", "btn", "shadow", "rounded", "text-", "bg-", "border-", "fw-", "align-items", "justify-content", "mb-", "mt-", "py-", "px-", "ms-", "me-"}
root = Path('frontend/src')
files = tuple(root.rglob('*.jsx')) + tuple(root.rglob('*.js'))
for path in files:
    try:
        text = path.read_text()
    except Exception:
        continue
    hits = []
    for idx, line in enumerate(text.splitlines(), 1):
        if 'className' not in line:
            continue
        match = re.search(r"className\s*=\s*(?:`|\"|\')(.*?)(?:`|\"|\')", line)
        if not match:
            continue
        classes = match.group(1)
        if any(token in classes for token in patterns):
            hits.append((idx, line.strip()))
    if hits:
        print(path)
        for idx, snippet in hits[:5]:
            print(f"  {idx}: {snippet}")
        if len(hits) > 5:
            print(f"   ... {len(hits) - 5} more occurrences")

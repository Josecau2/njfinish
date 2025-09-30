#!/usr/bin/env python3
"""Scan for CoreUI usage and optionally convert files to Chakra UI equivalents.

Usage examples
--------------
# Show files that still import/use CoreUI
python scripts/audit_coreui_usage.py --root frontend/src

# Automatically run the conversion helper for every matching file
python scripts/audit_coreui_usage.py --root frontend/src --convert

# Preview conversion without writing changes
python scripts/audit_coreui_usage.py --root frontend/src --convert --dry-run
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Iterable, List

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

try:
    from convert_coreui_to_chakra import process_file
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Unable to import convert_coreui_to_chakra. Make sure scripts/convert_coreui_to_chakra.py exists."
    ) from exc

COREUI_IMPORT_TOKEN = "@coreui/react"
COREUI_COMPONENT_PATTERN = re.compile(r"<C[A-Z][A-Za-z0-9]+")
DEFAULT_EXTENSIONS = (".js", ".jsx", ".ts", ".tsx")


def file_needs_migration(path: Path) -> bool:
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return False

    if COREUI_IMPORT_TOKEN in text:
        return True
    if COREUI_COMPONENT_PATTERN.search(text):
        return True
    return False


def scan_paths(root: Path, extensions: Iterable[str]) -> List[Path]:
    matches: List[Path] = []
    for extension in extensions:
        for path in root.rglob(f"*{extension}"):
            if not path.is_file():
                continue
            if file_needs_migration(path):
                matches.append(path)
    return matches


def main() -> None:
    parser = argparse.ArgumentParser(description="Find and optionally convert files still using CoreUI components.")
    parser.add_argument("--root", type=Path, default=Path("frontend/src"), help="Directory to scan (default: frontend/src)")
    parser.add_argument(
        "--extensions",
        nargs="*",
        default=list(DEFAULT_EXTENSIONS),
        help="File extensions to include (default: .js .jsx .ts .tsx)",
    )
    parser.add_argument(
        "--convert",
        action="store_true",
        help="Run the Chakra conversion helper on matching files.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview conversion changes without modifying files (implies --convert).",
    )
    args = parser.parse_args()

    if args.dry_run:
        args.convert = True

    root = args.root.resolve()
    if not root.exists():
        raise SystemExit(f"Scan root {root} does not exist.")

    matches = sorted(scan_paths(root, args.extensions))

    if not matches:
        print("No CoreUI usage detected under", root)
        return

    print(f"Found {len(matches)} file(s) using CoreUI components under {root}:\n")
    for path in matches:
        print(" -", path)

    if args.convert:
        print("\nRunning conversion helper...\n")
        for path in matches:
            process_file(path, dry_run=args.dry_run)

        if args.dry_run:
            print("\nDry run complete. No files were modified.")
        else:
            print("\nConversion pass finished. Review the diffs before committing.")


if __name__ == "__main__":
    main()

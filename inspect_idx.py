from pathlib import Path
lines = Path("frontend/src/pages/settings/taxes/TaxesPage.jsx").read_text().split('\n')
for i in range(300, 340):
    print(f"{i+1:04d}: {lines[i]}")

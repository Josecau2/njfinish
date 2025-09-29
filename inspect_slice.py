from pathlib import Path
text = Path("frontend/src/pages/settings/taxes/TaxesPage.jsx").read_text()
idx = 18243
print(repr(text[idx-80:idx+80]))

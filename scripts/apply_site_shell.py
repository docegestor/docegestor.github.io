from pathlib import Path
from site_shell import normalize_file

ROOT = Path(__file__).resolve().parents[1]
for section in ('blog', 'receitas', 'ebooks'):
    for path in (ROOT / section).rglob('*.html'):
        normalize_file(path)
print('Páginas existentes normalizadas:', sum(1 for section in ('blog', 'receitas', 'ebooks') for _ in (ROOT / section).rglob('*.html')))

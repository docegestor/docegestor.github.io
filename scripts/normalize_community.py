from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from migrate_frontend import blog_index, community_strip, ebooks_index, recipes_index

# Rebuild landing pages with the shared shell; the shared shell now has no community banner.
blog_index()
recipes_index()
ebooks_index()

for directory in ("blog", "receitas", "ebooks"):
    for path in (ROOT / directory).glob("*/index.html"):
        text = path.read_text(encoding="utf-8")
        text = re.sub(r'\s*<section class="community-callout">.*?</section>\s*', '\n', text, flags=re.S)
        text = re.sub(r'\s*<aside class="community-strip".*?</aside>\s*', '\n', text, flags=re.S)
        if '<main' in text:
            text = text.replace('<footer class="site-footer">', community_strip() + '<footer class="site-footer">', 1)
        elif 'id="root"' in text:
            text = text.replace('</body>', community_strip() + '</body>', 1)
        path.write_text(text, encoding="utf-8")
print("banners de comunidade removidos das páginas internas")

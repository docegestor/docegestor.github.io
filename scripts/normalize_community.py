from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from migrate_frontend import BASE_URL, blog_index, ebooks_index, footer, recipes_index, shell

# Rebuild the three landing pages so their callout comes from the same shared helper.
blog_index()
recipes_index()
ebooks_index()

callout = '''<section class="community-callout"><div><p class="eyebrow">Doce &amp; Lucro</p><h2>Ideias práticas para sua confeitaria.</h2><p>Receba conteúdos curtos sobre produção, vendas e organização.</p></div><a class="button button-light" href="https://t.me/docelucro" target="_blank" rel="noopener">Entrar na comunidade <span aria-hidden="true">→</span></a></section>'''

for directory in ("blog", "receitas", "ebooks"):
    for path in (ROOT / directory).glob("*/index.html"):
        text = path.read_text(encoding="utf-8")
        text = re.sub(r'\s*<section class="community-callout">.*?</section>\s*', '\n', text, flags=re.S)
        marker = '<footer class="site-footer">'
        if marker in text:
            text = text.replace(marker, callout + marker, 1)
        path.write_text(text, encoding="utf-8")
print("callouts normalizados")

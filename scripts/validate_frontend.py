from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from publicar_artigo_estatico import load_json, normalize_article, render
from publicar_receitas import render_recipe

errors = []
required = ["index.html", "blog/index.html", "receitas/index.html", "ebooks/index.html", "assets/editorial.css", "favicon.svg"]
for rel in required:
    if not (ROOT / rel).exists(): errors.append(f"ausente: {rel}")

pages = [ROOT / "blog/index.html", ROOT / "receitas/index.html", ROOT / "ebooks/index.html"]
pages += sorted((ROOT / "blog").glob("*/index.html"))
pages += sorted((ROOT / "receitas").glob("*/index.html"))
for path in pages:
    text = path.read_text(encoding="utf-8")
    if 'rel="icon"' not in text: errors.append(f"sem favicon: {path.relative_to(ROOT)}")
    if 'class="site-footer"' not in text and path.name == "index.html" and path.parent.name in {"blog", "receitas", "ebooks"}: errors.append(f"sem rodapé: {path.relative_to(ROOT)}")
    if text.count('class="site-footer"') > 1: errors.append(f"rodapé duplicado: {path.relative_to(ROOT)}")

articles = load_json(ROOT / "data/artigos_publicados_estaticos.json", [])
recipes = load_json(ROOT / "data/receitas_publicadas.json", [])
if articles:
    sample = articles[0]
    if not render(normalize_article({"title":sample["title"],"description":sample["description"],"intro":sample["description"],"conclusion":"Conclusão de teste.","slug":sample["slug"],"sections":[{"heading":"A","paragraphs":["B"]},{"heading":"C","paragraphs":["D"]},{"heading":"E","paragraphs":["F"]}]}), "2026-01-01", articles): errors.append("render de artigo vazio")
if recipes:
    sample = dict(recipes[0])
    sample.setdefault("ingredients", ["1 xícara de teste", "1 colher de teste"])
    sample.setdefault("steps", ["Misture os ingredientes.", "Finalize o preparo."])
    if not render_recipe(sample, sample.get("published", "2026-01-01")): errors.append("render de receita vazio")

home = (ROOT / "index.html").read_text(encoding="utf-8")
if 'id="site-navigation"' in home: errors.append("camada de navegação antiga ainda presente na home")
if 'id="site-credit"' not in home: errors.append("crédito de desenvolvedor ausente na home")

if errors:
    print("VALIDATION FAILED")
    print("\n".join(errors))
    raise SystemExit(1)
print(f"OK: {len(pages)} páginas editoriais verificadas; {len(articles)} artigos e {len(recipes)} receitas registrados.")

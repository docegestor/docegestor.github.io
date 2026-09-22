#!/usr/bin/env python3
"""Publica receitas previamente aprovadas como HTML estático sem alterar a fila editorial."""
from __future__ import annotations
import argparse, datetime as dt, html, json, re
from pathlib import Path
from typing import Any

from migrate_frontend import BASE_URL, ROOT, footer, nav, recipes_index

QUEUE = ROOT / "data" / "receitas_pendentes.json"
REGISTRY = ROOT / "data" / "receitas_publicadas.json"

def esc(value: Any) -> str: return html.escape(str(value or ""), quote=True)
def load(path: Path, default: Any): return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default
def slugify(value: str) -> str:
    table = str.maketrans("áàâãéêíóôõúüç", "aaaaeeiooouuc")
    return re.sub(r"[^a-z0-9]+", "-", value.lower().strip().translate(table)).strip("-")[:80]
def validate(item: dict[str, Any]) -> None:
    required = ["title", "description", "ingredients", "steps"]
    if any(not item.get(key) for key in required): raise RuntimeError(f"Receita incompleta: {item.get('slug', item.get('title', 'sem slug'))}")
    if not isinstance(item["ingredients"], list) or not isinstance(item["steps"], list): raise RuntimeError(f"Ingredientes e preparo devem ser listas: {item.get('slug')}")
    if len(item["ingredients"]) < 2 or len(item["steps"]) < 2: raise RuntimeError(f"Receita curta demais: {item.get('slug')}")

def render_recipe(item: dict[str, Any], published: str) -> str:
    slug = item["slug"]; canonical = f"{BASE_URL}/receitas/{slug}/"
    ingredients = "".join(f"<li>{esc(x)}</li>" for x in item["ingredients"]); steps = "".join(f"<li>{esc(x)}</li>" for x in item["steps"]); tips = "".join(f"<li>{esc(x)}</li>" for x in item.get("tips", []))
    source = f'<p class="source">Fonte consultada: <a href="{esc(item["source_url"])}" rel="nofollow noopener">{esc(item.get("source_name", item["source_url"]))}</a></p>' if item.get("source_url") else ""
    schema = {"@context":"https://schema.org","@type":"Recipe","name":item["title"],"description":item["description"],"recipeCategory":item.get("category","Receitas"),"prepTime":item.get("prep_time",""),"cookTime":item.get("cook_time",""),"recipeYield":item.get("yield",""),"recipeIngredient":item["ingredients"],"recipeInstructions":[{"@type":"HowToStep","text":x} for x in item["steps"]],"datePublished":published,"dateModified":published}
    body = f'''<main class="article-main"><div class="content-back"><a href="/receitas/">← Voltar para receitas</a></div><section class="article-hero"><div class="tag">{esc(item.get("category", "Receitas"))}</div><h1>{esc(item["title"])}</h1><p class="lead">{esc(item["description"])}</p><p class="meta">Preparo: {esc(item.get("prep_time", "não informado"))} · Forno/fogo: {esc(item.get("cook_time", "não informado"))} · Rendimento: {esc(item.get("yield", "não informado"))}</p></section><section class="card recipe-ingredients"><h2>Ingredientes</h2><ul>{ingredients}</ul></section><section class="recipe-steps"><h2>Modo de preparo</h2><ol>{steps}</ol></section>{f'<section class="card"><h2>Dicas para o preparo</h2><ul>{tips}</ul></section>' if tips else ''}{source}<p class="meta">Publicado em {published}</p></main>'''
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f4775b"><meta name="robots" content="index,follow"><meta name="author" content="DoceGestor"><meta name="description" content="{esc(item['description'])}"><title>{esc(item['title'])} | Receitas DoceGestor</title><link rel="canonical" href="{canonical}"><meta property="og:type" content="article"><meta property="og:title" content="{esc(item['title'])}"><meta property="og:description" content="{esc(item['description'])}"><meta property="og:url" content="{canonical}"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="/assets/editorial.css"><script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script></head><body class="editorial-page">{nav("Receitas")}{body}{footer()}</body></html>'''

def update_sitemap(registry: list[dict[str, Any]]) -> None:
    path = ROOT / "sitemap.xml"; text = path.read_text(encoding="utf-8") if path.exists() else '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n'
    text = re.sub(r"\s*<url><loc>https://docegestor\.github\.io/receitas/[^<]+</loc>.*?</url>", "", text, flags=re.S)
    entries = "".join(f"  <url><loc>{BASE_URL}/receitas/{esc(x['slug'])}/</loc><lastmod>{x['published']}</lastmod><priority>0.7</priority></url>\n" for x in registry)
    text = re.sub(r"\s*<url><loc>https://docegestor\.github\.io/receitas/</loc>.*?</url>", "", text, flags=re.S)
    index_entry = f"  <url><loc>{BASE_URL}/receitas/</loc><lastmod>{dt.date.today().isoformat()}</lastmod><priority>0.8</priority></url>\n"
    path.write_text(text.replace("</urlset>", index_entry + entries + "</urlset>"), encoding="utf-8")

def main() -> int:
    parser = argparse.ArgumentParser(); parser.add_argument("--limit", type=int, default=1); args = parser.parse_args()
    queue = load(QUEUE, []); queue = [queue] if isinstance(queue, dict) else queue; registry = load(REGISTRY, []); used = {slugify(str(x.get("slug", ""))) for x in registry if x.get("slug")}; pending = []; consumed = set()
    for item in queue:
        normalized_slug = slugify(str(item.get("slug") or item.get("title") or ""))
        if normalized_slug in used: consumed.add(normalized_slug); continue
        item["slug"] = normalized_slug; pending.append(item)
    today = dt.date.today().isoformat(); selected = pending[:max(0, args.limit)]
    for item in selected:
        validate(item); out_dir = ROOT / "receitas" / item["slug"]; out_dir.mkdir(parents=True, exist_ok=False); item["published"] = today
        (out_dir / "index.html").write_text(render_recipe(item, today), encoding="utf-8")
        registry.insert(0, {key:item[key] for key in ("slug","title","description","category","published","source_name","source_url","ingredients","steps","tips") if key in item}); consumed.add(item["slug"])
    QUEUE.write_text(json.dumps([item for item in queue if slugify(str(item.get("slug") or item.get("title") or "")) not in consumed], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REGISTRY.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    recipes_index(registry); update_sitemap(registry); print(f"Receitas publicadas: {len(selected)}"); return 0

if __name__ == "__main__": raise SystemExit(main())

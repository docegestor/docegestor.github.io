#!/usr/bin/env python3
"""Publica receitas previamente aprovadas como HTML estático.

Não coleta, copia ou transforma páginas de terceiros. A fila em
 data/receitas_pendentes.json deve conter conteúdo autoral ou autorizado.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://docegestor.github.io"
QUEUE = ROOT / "data" / "receitas_pendentes.json"
REGISTRY = ROOT / "data" / "receitas_publicadas.json"


def esc(value: Any) -> str:
    return html.escape(str(value or ""), quote=True)


def load(path: Path, default: Any) -> Any:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def slugify(value: str) -> str:
    value = value.lower().strip()
    table = str.maketrans("áàâãéêíóôõúüç", "aaaaeeiooouuc")
    return re.sub(r"[^a-z0-9]+", "-", value.translate(table)).strip("-")[:80]


def validate(item: dict[str, Any]) -> None:
    required = ["title", "description", "ingredients", "steps"]
    if any(not item.get(key) for key in required):
        raise RuntimeError(f"Receita incompleta: {item.get('slug', item.get('title', 'sem slug'))}")
    if not isinstance(item["ingredients"], list) or not isinstance(item["steps"], list):
        raise RuntimeError(f"Ingredientes e preparo devem ser listas: {item.get('slug')}")
    if len(item["ingredients"]) < 2 or len(item["steps"]) < 2:
        raise RuntimeError(f"Receita curta demais: {item.get('slug')}")


def render_recipe(item: dict[str, Any], published: str) -> str:
    slug = item["slug"]
    canonical = f"{BASE_URL}/receitas/{slug}/"
    ingredients = "".join(f"<li>{esc(x)}</li>" for x in item["ingredients"])
    steps = "".join(f"<li>{esc(x)}</li>" for x in item["steps"])
    tips = "".join(f"<li>{esc(x)}</li>" for x in item.get("tips", []))
    source = ""
    if item.get("source_url"):
        source = f'<p class="source">Fonte consultada: <a href="{esc(item["source_url"])}" rel="nofollow noopener">{esc(item.get("source_name", item["source_url"]))}</a></p>'
    schema = {
        "@context": "https://schema.org", "@type": "Recipe", "name": item["title"],
        "description": item["description"], "recipeCategory": item.get("category", "Receitas"),
        "prepTime": item.get("prep_time", ""), "cookTime": item.get("cook_time", ""),
        "recipeYield": item.get("yield", ""), "recipeIngredient": item["ingredients"],
        "recipeInstructions": [{"@type": "HowToStep", "text": x} for x in item["steps"]],
        "datePublished": published, "dateModified": published,
    }
    return f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(item["title"])} | Receitas DoceGestor</title><meta name="description" content="{esc(item["description"])}"><link rel="canonical" href="{canonical}">
<meta property="og:type" content="article"><meta property="og:title" content="{esc(item["title"])}"><meta property="og:description" content="{esc(item["description"])}"><meta property="og:url" content="{canonical}"><script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
<style>body{{margin:0;background:#fffaf8;color:#3b1f1b;font:16px/1.7 Arial,sans-serif}}a{{color:#d9553c}}header,main,footer{{max-width:920px;margin:auto;padding:24px}}header{{display:flex;justify-content:space-between;gap:20px;align-items:center;border-bottom:1px solid #f2d9d1}}header a{{font-weight:bold;text-decoration:none}}main{{padding-top:42px}}.tag{{color:#d9553c;text-transform:uppercase;font-size:13px;font-weight:bold;letter-spacing:.08em}}h1{{font:700 44px/1.15 Georgia,serif;margin:12px 0}}h2{{font:700 27px Georgia,serif;margin-top:34px}}.lead{{font-size:20px;color:#654a45}}.meta,.source{{font-size:14px;color:#806b65}}.card{{background:#fff1ed;border:1px solid #f2cfc5;border-radius:16px;padding:20px;margin:24px 0}}li{{margin:8px 0}}footer{{border-top:1px solid #f2d9d1;margin-top:50px;font-size:14px;color:#806b65}}@media(max-width:600px){{h1{{font-size:36px}}header{{display:block}}}}</style></head>
<body><header><a href="/receitas/">Receitas DoceGestor</a><nav><a href="/blog/">Blog</a> · <a href="/">Página inicial</a></nav></header>
<main><div class="tag">{esc(item.get("category", "Receitas"))}</div><h1>{esc(item["title"])}</h1><p class="lead">{esc(item["description"])}</p><p class="meta">Preparo: {esc(item.get("prep_time", "não informado"))} · Forno/fogo: {esc(item.get("cook_time", "não informado"))} · Rendimento: {esc(item.get("yield", "não informado"))}</p>
<section class="card"><h2>Ingredientes</h2><ul>{ingredients}</ul></section><section><h2>Modo de preparo</h2><ol>{steps}</ol></section>{f'<section class="card"><h2>Dicas</h2><ul>{tips}</ul></section>' if tips else ''}{source}<p class="meta">Publicado em {published}</p></main><footer>Receitas autorais e conteúdo editorial do DoceGestor.</footer></body></html>'''


def update_index(registry: list[dict[str, Any]]) -> None:
    cards = "".join(f'<article class="card"><div class="tag">{esc(x.get("category", "Receitas"))}</div><h2><a href="/receitas/{esc(x["slug"])}/">{esc(x["title"])}</a></h2><p>{esc(x["description"])}</p><a href="/receitas/{esc(x["slug"])}/">Ver receita →</a></article>' for x in registry)
    page = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Receitas de doces e bolos | DoceGestor</title><meta name="description" content="Receitas de doces e bolos para preparar, testar e organizar sua produção."><link rel="canonical" href="{BASE_URL}/receitas/"><style>body{{margin:0;background:#fffaf8;color:#3b1f1b;font:16px/1.7 Arial,sans-serif}}header,main,footer{{max-width:1080px;margin:auto;padding:24px}}header{{display:flex;justify-content:space-between;border-bottom:1px solid #f2d9d1}}a{{color:#d9553c}}h1{{font:700 44px Georgia,serif}}.intro{{font-size:20px;color:#654a45;max-width:720px}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin-top:32px}}.card{{background:white;border:1px solid #f2d9d1;border-radius:16px;padding:22px;box-shadow:0 8px 22px #3b1f1b0d}}.card h2{{font:700 25px Georgia,serif}}.tag{{color:#d9553c;text-transform:uppercase;font-size:13px;font-weight:bold;letter-spacing:.08em}}footer{{border-top:1px solid #f2d9d1;margin-top:50px;color:#806b65}}</style></head><body><header><a href="/receitas/"><strong>Receitas DoceGestor</strong></a><nav><a href="/blog/">Blog</a> · <a href="/">Página inicial</a></nav></header><main><h1>Receitas de doces e bolos</h1><p class="intro">Uma área estática para receitas autorais, revisadas e organizadas para a rotina de confeitaria.</p><div class="grid">{cards}</div></main><footer>DoceGestor · Receitas e gestão para confeiteiras</footer></body></html>'''
    (ROOT / "receitas" / "index.html").write_text(page, encoding="utf-8")


def update_sitemap(registry: list[dict[str, Any]]) -> None:
    path = ROOT / "sitemap.xml"
    text = path.read_text(encoding="utf-8") if path.exists() else '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n'
    entries = re.findall(r'\s*<url><loc>https://docegestor\.github\.io/receitas/[^<]+</loc>.*?</url>', text, flags=re.S)
    for entry in entries:
        text = text.replace(entry, "")
    new_entries = "".join(f'  <url><loc>{BASE_URL}/receitas/{esc(x["slug"])}/</loc><lastmod>{x["published"]}</lastmod><priority>0.7</priority></url>\n' for x in registry)
    index_entry = f'  <url><loc>{BASE_URL}/receitas/</loc><lastmod>{dt.date.today().isoformat()}</lastmod><priority>0.8</priority></url>\n'
    text = text.replace("</urlset>", index_entry + new_entries + "</urlset>")
    path.write_text(text, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=1)
    args = parser.parse_args()
    queue = load(QUEUE, [])
    registry = load(REGISTRY, [])
    used = {x["slug"] for x in registry}
    pending = [x for x in queue if x.get("slug") not in used]
    today = dt.date.today().isoformat()
    selected = pending[: max(0, args.limit)]
    for item in selected:
        item["slug"] = slugify(item.get("slug") or item["title"])
        validate(item)
        out_dir = ROOT / "receitas" / item["slug"]
        out_dir.mkdir(parents=True, exist_ok=False)
        item["published"] = today
        (out_dir / "index.html").write_text(render_recipe(item, today), encoding="utf-8")
        registry.insert(0, {key: item[key] for key in ("slug", "title", "description", "category", "published", "source_name", "source_url") if key in item})
    REGISTRY.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    update_index(registry)
    update_sitemap(registry)
    print(f"Receitas publicadas: {len(selected)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

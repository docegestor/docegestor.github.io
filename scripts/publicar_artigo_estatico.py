#!/usr/bin/env python3
"""Converte um artigo estruturado em uma postagem HTML canônica dentro de /blog/."""
from __future__ import annotations
import argparse, datetime as dt, html, json, re
from pathlib import Path
from typing import Any

from migrate_frontend import BASE_URL, MARKET_URL, ROOT, footer, nav

QUEUE = ROOT / "data" / "artigos_pendentes.json"
REGISTRY = ROOT / "data" / "artigos_publicados_estaticos.json"
LEGACY_REGISTRY = ROOT / "data" / "artigos_automatizados.json"

def esc(value: Any) -> str:
    return html.escape(str(value or ""), quote=True)

def load_json(path: Path, default: Any) -> Any:
    if not path.exists(): return default
    with path.open(encoding="utf-8") as f: return json.load(f)

def slugify(value: str) -> str:
    table = str.maketrans("áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ", "aaaaeeiooouucAAAAEEIOOOUUC")
    return re.sub(r"[^a-z0-9]+", "-", value.translate(table).lower()).strip("-")[:90]

def normalize_article(raw: dict[str, Any]) -> dict[str, Any]:
    a = dict(raw)
    a["title"] = str(a.get("title") or a.get("titulo") or "").strip()
    a["description"] = str(a.get("description") or a.get("descricao") or a.get("meta_description") or "").strip()
    a["intro"] = str(a.get("intro") or a.get("introduction") or a.get("resumo") or a["description"]).strip()
    a["category"] = str(a.get("category") or a.get("categoria") or "Gestão").strip()
    a["conclusion"] = str(a.get("conclusion") or a.get("conclusao") or "").strip()
    sections = a.get("sections") or a.get("secoes") or a.get("sections_html") or []
    normalized = []
    for section in sections:
        if isinstance(section, str): normalized.append({"heading":"", "paragraphs":[section], "bullets":[]}); continue
        paragraphs = section.get("paragraphs") or section.get("paragrafos") or section.get("content") or []
        if isinstance(paragraphs, str): paragraphs = [paragraphs]
        bullets = section.get("bullets") or section.get("lista") or []
        if isinstance(bullets, str): bullets = [bullets]
        normalized.append({"heading":str(section.get("heading") or section.get("titulo") or "").strip(), "paragraphs":[str(x).strip() for x in paragraphs if str(x).strip()], "bullets":[str(x).strip() for x in bullets if str(x).strip()]})
    a["sections"] = normalized
    faq = a.get("faq") or a.get("perguntas_frequentes") or []
    a["faq"] = [{"question":str(x.get("question") or x.get("pergunta") or "").strip(), "answer":str(x.get("answer") or x.get("resposta") or "").strip()} for x in faq if isinstance(x, dict)]
    a["slug"] = slugify(str(a.get("slug") or a["title"]))
    return a

def validate(a: dict[str, Any]) -> None:
    missing = [x for x in ("title", "description", "intro", "conclusion", "slug") if not a.get(x)]
    if missing: raise RuntimeError("Artigo sem campos obrigatórios: " + ", ".join(missing))
    if len(a["title"]) > 90: raise RuntimeError("Título maior que 90 caracteres.")
    if len(a["description"]) > 170: raise RuntimeError("Meta description maior que 170 caracteres.")
    if len(a["sections"]) < 3: raise RuntimeError("O artigo precisa de pelo menos 3 seções.")
    if any(not x["heading"] or not x["paragraphs"] for x in a["sections"]): raise RuntimeError("Cada seção precisa de título e pelo menos um parágrafo.")

def render(a: dict[str, Any], published: str, related: list[dict[str, Any]]) -> str:
    canonical = f"{BASE_URL}/blog/{a['slug']}/"
    sections = []
    for i, section in enumerate(a["sections"]):
        bullets = "".join(f"<li>{esc(x)}</li>" for x in section["bullets"])
        list_html = f"<ul>{bullets}</ul>" if bullets else ""
        paragraphs = "".join(f"<p>{esc(p)}</p>" for p in section["paragraphs"])
        sections.append(f'<section id="sec-{i}" class="article-section"><h2>{esc(section["heading"])}</h2>{paragraphs}{list_html}</section>')
    faq = "".join(f'<h3>{esc(x["question"])}</h3><p>{esc(x["answer"])}</p>' for x in a["faq"] if x["question"] and x["answer"])
    faq_html = f'<section class="article-section faq-section"><h2>Perguntas frequentes</h2>{faq}</section>' if faq else ""
    related_html = "".join(f'<li><a href="/blog/{esc(x["slug"])}/">{esc(x["title"])}</a></li>' for x in related[:4])
    schema = {"@context":"https://schema.org","@type":"BlogPosting","headline":a["title"],"description":a["description"],"datePublished":published,"dateModified":published,"author":{"@type":"Organization","name":"DoceGestor"},"mainEntityOfPage":canonical}
    body = f'''<main class="article-main"><div class="content-back"><a href="/blog/">← Voltar para o blog</a></div><section class="article-hero"><div class="tag">{esc(a["category"])}</div><h1>{esc(a["title"])}</h1><p class="lead">{esc(a["intro"])}</p><p class="meta">Publicado em {published} · Equipe DoceGestor</p></section><div class="toc"><strong>Neste artigo</strong><ul>{''.join(f'<li><a href="#sec-{i}">{esc(s["heading"])}</a></li>' for i,s in enumerate(a["sections"]))}</ul></div>{''.join(sections)}{faq_html}<section class="article-section"><h2>Conclusão</h2><p>{esc(a["conclusion"])}</p></section><section class="article-section card"><strong>Quer simplificar a rotina da sua confeitaria?</strong><p>Conheça o DoceGestor para acompanhar custos, vendas e lucro em um só lugar.</p><p><a href="{MARKET_URL}" target="_blank" rel="sponsored noopener">Conhecer o app →</a></p></section><section class="article-section"><h2>Leia também</h2><ul>{related_html}</ul></section></main>'''
    title = f"{a['title']} | DoceGestor"
    description = a["description"].replace('"', '&quot;')
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f4775b"><meta name="robots" content="index,follow"><meta name="author" content="DoceGestor"><meta name="description" content="{description}"><title>{esc(title)}</title><link rel="canonical" href="{canonical}"><meta property="og:type" content="article"><meta property="og:title" content="{esc(a['title'])}"><meta property="og:description" content="{description}"><meta property="og:url" content="{canonical}"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="/assets/editorial.css"><script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script></head><body class="editorial-page">{nav("Blog")}{body}{footer()}</body></html>'''

def update_blog_index(registry: list[dict[str, Any]]) -> None:
    # Rebuild only the index shell/cards; the registry remains the source of truth.
    from migrate_frontend import blog_index
    blog_index(registry)

def update_sitemap(registry: list[dict[str, Any]]) -> None:
    path = ROOT / "sitemap.xml"; text = path.read_text(encoding="utf-8")
    text = re.sub(r"\s*<url><loc>https://docegestor\.github\.io/blog/[^<]+</loc>.*?</url>", "", text, flags=re.S)
    entries = "".join(f"  <url><loc>{BASE_URL}/blog/{esc(x['slug'])}/</loc><lastmod>{x['published']}</lastmod><priority>0.8</priority></url>\n" for x in registry)
    path.write_text(text.replace("</urlset>", entries + "</urlset>"), encoding="utf-8")

def main() -> int:
    ap = argparse.ArgumentParser(); ap.add_argument("--limit", type=int, default=1); ap.add_argument("--input", type=Path); ap.add_argument("--dry-run", action="store_true"); args = ap.parse_args()
    if args.limit < 0 or args.limit > 3: raise RuntimeError("--limit deve estar entre 0 e 3.")
    raw = load_json(args.input, []) if args.input else load_json(QUEUE, [])
    if isinstance(raw, dict): raw = [raw]
    registry = load_json(REGISTRY, []); known = {x.get("slug") for x in registry}
    for old in load_json(LEGACY_REGISTRY, []):
        if old.get("slug") and old["slug"] not in known:
            registry.append({"slug":old["slug"],"title":old.get("title",""),"description":old.get("description",""),"category":old.get("category","Gestão"),"published":old.get("published",dt.date.today().isoformat())}); known.add(old["slug"])
    used = {x.get("slug") for x in registry}; pending = []
    for item in raw:
        a = normalize_article(item); validate(a)
        if a["slug"] not in used: pending.append(a)
    selected = pending[:args.limit]; today = dt.date.today().isoformat()
    if args.dry_run:
        for a in selected: render(a, today, registry)
        print(f"Artigos validados (dry-run): {len(selected)}"); return 0
    for a in selected:
        out = ROOT / "blog" / a["slug"]; out.mkdir(parents=True, exist_ok=False)
        (out / "index.html").write_text(render(a, today, registry), encoding="utf-8")
        registry.insert(0, {"slug":a["slug"],"title":a["title"],"description":a["description"],"category":a["category"],"published":today})
    if selected or registry != load_json(REGISTRY, []):
        REGISTRY.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"); update_blog_index(registry); update_sitemap(registry)
    print(f"Artigos publicados no blog: {len(selected)}"); return 0

if __name__ == "__main__": raise SystemExit(main())

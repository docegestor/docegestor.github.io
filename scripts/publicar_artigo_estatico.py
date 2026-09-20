#!/usr/bin/env python3
"""Publica um artigo previamente revisado em /blog/<slug>/ sem IA."""
from __future__ import annotations
import argparse, datetime as dt, html, json, re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = 'https://docegestor.github.io'
QUEUE = ROOT / 'data' / 'artigos_pendentes.json'
REGISTRY = ROOT / 'data' / 'artigos_publicados_estaticos.json'

def esc(v: Any) -> str: return html.escape(str(v or ''), quote=True)
def load(p: Path, default: Any) -> Any: return json.loads(p.read_text(encoding='utf-8')) if p.exists() else default

def slugify(v: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', v.lower().translate(str.maketrans('áàâãéêíóôõúüç','aaaaeeiooouuc'))).strip('-')[:80]

def validate(a: dict[str, Any]) -> None:
    for key in ('title','description','intro','sections','conclusion'):
        if not a.get(key): raise RuntimeError(f'Artigo sem campo obrigatório: {key}')
    if not isinstance(a['sections'], list) or len(a['sections']) < 3: raise RuntimeError('O artigo precisa de pelo menos 3 seções.')
    if any(not isinstance(x, dict) or not x.get('heading') or not x.get('paragraphs') for x in a['sections']): raise RuntimeError('Cada seção precisa de heading e paragraphs.')

def render(a: dict[str, Any], slug: str, published: str, related: list[dict[str, Any]]) -> str:
    canonical=f'{BASE_URL}/blog/{slug}/'
    sections=''.join(f'<section><h2>{esc(s["heading"])}</h2>{"".join(f"<p>{esc(p)}</p>" for p in s["paragraphs"])}{"<ul>"+"".join(f"<li>{esc(x)}</li>" for x in s.get("bullets", []))+"</ul>" if s.get("bullets") else ""}</section>' for s in a['sections'])
    faq=''.join(f'<h3>{esc(x["question"])}</h3><p>{esc(x["answer"])}</p>' for x in a.get('faq', []) if x.get('question') and x.get('answer'))
    if faq: faq=f'<section><h2>Perguntas frequentes</h2>{faq}</section>'
    links=''.join(f'<li><a href="/blog/{esc(x["slug"])}/">{esc(x["title"])}</a></li>' for x in related[:4])
    schema={'@context':'https://schema.org','@type':'BlogPosting','headline':a['title'],'description':a['description'],'datePublished':published,'dateModified':published,'author':{'@type':'Organization','name':'DoceGestor'},'mainEntityOfPage':canonical}
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(a["title"])} | DoceGestor</title><meta name="description" content="{esc(a["description"])}"><link rel="canonical" href="{canonical}"><meta property="og:type" content="article"><meta property="og:title" content="{esc(a["title"])}"><meta property="og:description" content="{esc(a["description"])}"><meta property="og:url" content="{canonical}"><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script><style>body{{margin:0;background:#fffaf8;color:#3b1f1b;font:17px/1.75 Arial,sans-serif}}header,main,footer{{max-width:920px;margin:auto;padding:24px}}header{{display:flex;justify-content:space-between;border-bottom:1px solid #f2d9d1}}a{{color:#d9553c}}h1{{font:700 46px/1.12 Georgia,serif}}h2{{font:700 28px Georgia,serif;margin-top:36px}}.tag{{color:#d9553c;text-transform:uppercase;font-size:13px;font-weight:bold;letter-spacing:.08em}}.lead{{font-size:21px;color:#654a45}}.meta{{font-size:14px;color:#806b65}}.toc,.cta{{background:#fff1ed;border:1px solid #f2cfc5;border-radius:16px;padding:18px 24px;margin:28px 0}}li{{margin:8px 0}}footer{{border-top:1px solid #f2d9d1;margin-top:48px;color:#806b65;font-size:14px}}@media(max-width:600px){{h1{{font-size:36px}}header{{display:block}}}}</style></head><body><header><a href="/blog/"><strong>Blog DoceGestor</strong></a><nav><a href="/receitas/">Receitas</a> · <a href="/">Página inicial</a></nav></header><main><div class="tag">{esc(a.get("category","Gestão"))}</div><h1>{esc(a["title"])}</h1><p class="lead">{esc(a["intro"])}</p><p class="meta">Publicado em {published} · Equipe DoceGestor</p><div class="toc"><strong>Neste artigo</strong><ul>{''.join(f'<li><a href="#sec-{i}">{esc(s["heading"])}</a></li>' for i,s in enumerate(a['sections']))}</ul></div>{''.join(s.replace('<section>',f'<section id="sec-{i}">',1) for i,s in enumerate(re.findall(r'<section>.*?</section>',sections,re.S)))}{faq}<section><h2>Conclusão</h2><p>{esc(a['conclusion'])}</p></section><div class="cta"><strong>Quer organizar melhor sua confeitaria?</strong><p>Conheça o DoceGestor para acompanhar custos, vendas e lucro em um só lugar.</p></div><section><h2>Leia também</h2><ul>{links}</ul></section></main><footer>DoceGestor · Conteúdo educativo para confeiteiras</footer></body></html>'''

def update_blog_index(registry: list[dict[str, Any]]) -> None:
    p=ROOT/'blog/index.html'; text=p.read_text(encoding='utf-8'); start='<!-- AUTOMATED_ARTICLES_START -->'; end='<!-- AUTOMATED_ARTICLES_END -->'
    if start not in text or end not in text: raise RuntimeError('blog/index.html sem marcadores reservados.')
    cards=''.join(f'<a href="/blog/{esc(x["slug"])}/" style="display:block;overflow:hidden;border:1px solid #f3c5b8;border-radius:18px;background:#fffaf8;text-decoration:none;color:#3b1f1b;padding:20px"><small style="color:#e65f47;font-weight:700;text-transform:uppercase">{esc(x.get("category","Gestão"))}</small><strong style="display:block;margin-top:6px;font-size:18px">{esc(x["title"])}</strong><span style="display:block;margin-top:8px;opacity:.75;line-height:1.5">{esc(x["description"])}</span><span style="display:block;margin-top:12px;color:#e65f47;font-weight:700">Ler artigo →</span></a>' for x in registry[:12])
    block=f'''{start}<section id="automated-articles" style="display:block;max-width:1152px;margin:40px auto;padding:0 24px 60px;font-family:DM Sans,sans-serif"><h2 style="font-family:Playfair Display,serif;font-size:32px;color:#3b1f1b">Artigos novos</h2><div id="automated-articles-list" style="display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">{cards}</div></section>{end}'''
    text=text.split(start,1)[0]+block+text.split(end,1)[1]
    text=re.sub(r'<script id="automated-blog-sync">.*?</script>','',text,flags=re.S)
    p.write_text(text,encoding='utf-8')

def update_sitemap(registry: list[dict[str, Any]]) -> None:
    p=ROOT/'sitemap.xml'; text=p.read_text(encoding='utf-8'); text=re.sub(r'\s*<url><loc>https://docegestor\.github\.io/blog/[^<]+</loc>.*?</url>','',text,flags=re.S)
    entries=''.join(f'  <url><loc>{BASE_URL}/blog/{esc(x["slug"])}/</loc><lastmod>{x["published"]}</lastmod><priority>0.8</priority></url>\n' for x in registry)
    p.write_text(text.replace('</urlset>',entries+'</urlset>'),encoding='utf-8')

def main() -> int:
    ap=argparse.ArgumentParser(); ap.add_argument('--limit',type=int,default=1); args=ap.parse_args()
    if not 0 <= args.limit <= 3: raise RuntimeError('--limit deve estar entre 0 e 3.')
    queue=load(QUEUE,[]); registry=load(REGISTRY,[]); used={x['slug'] for x in registry}; pending=[x for x in queue if x.get('slug') not in used]
    selected=pending[:args.limit]; today=dt.date.today().isoformat()
    for a in selected:
        a['slug']=slugify(a.get('slug') or a['title']); validate(a); out=ROOT/'blog'/a['slug']; out.mkdir(parents=True,exist_ok=False); (out/'index.html').write_text(render(a,a['slug'],today,registry),encoding='utf-8'); registry.insert(0,{k:a[k] for k in ('slug','title','description','category') if k in a}|{'published':today})
    REGISTRY.write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); update_blog_index(registry); update_sitemap(registry); print(f'Artigos estáticos publicados: {len(selected)}'); return 0

if __name__=='__main__': raise SystemExit(main())

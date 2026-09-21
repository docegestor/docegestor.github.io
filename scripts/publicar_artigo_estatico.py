#!/usr/bin/env python3
"""Converte um artigo estruturado em uma postagem HTML canônica dentro de /blog/."""
from __future__ import annotations
import argparse, datetime as dt, html, json, re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = 'https://docegestor.github.io'
QUEUE = ROOT / 'data' / 'artigos_pendentes.json'
REGISTRY = ROOT / 'data' / 'artigos_publicados_estaticos.json'
LEGACY_REGISTRY = ROOT / 'data' / 'artigos_automatizados.json'
MARK_START = '<!-- AUTOMATED_ARTICLES_START -->'
MARK_END = '<!-- AUTOMATED_ARTICLES_END -->'
MARKET_URL = 'https://www.mercadolivre.com.br/docegestor-sistema-para-confeitaria--precificacao-e-vendas/up/MLBU4686356819?pdp_filters=item_id:MLB7401439782'

def esc(value: Any) -> str:
    return html.escape(str(value or ''), quote=True)

def load_json(path: Path, default: Any) -> Any:
    if not path.exists(): return default
    with path.open(encoding='utf-8') as f: return json.load(f)

def slugify(value: str) -> str:
    table = str.maketrans('áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ', 'aaaaeeiooouucAAAAEEIOOOUUC')
    return re.sub(r'[^a-z0-9]+', '-', value.translate(table).lower()).strip('-')[:90]

def normalize_article(raw: dict[str, Any]) -> dict[str, Any]:
    """Aceita o contrato novo e pequenas variações comuns do JSON retornado pela IA."""
    a = dict(raw)
    a['title'] = str(a.get('title') or a.get('titulo') or '').strip()
    a['description'] = str(a.get('description') or a.get('descricao') or a.get('meta_description') or '').strip()
    a['intro'] = str(a.get('intro') or a.get('introduction') or a.get('resumo') or a['description']).strip()
    a['category'] = str(a.get('category') or a.get('categoria') or 'Gestão').strip()
    a['conclusion'] = str(a.get('conclusion') or a.get('conclusao') or '').strip()
    sections = a.get('sections') or a.get('secoes') or a.get('sections_html') or []
    normalized=[]
    for section in sections:
        if isinstance(section, str): normalized.append({'heading':'', 'paragraphs':[section], 'bullets':[]}); continue
        paragraphs = section.get('paragraphs') or section.get('paragrafos') or section.get('content') or []
        if isinstance(paragraphs, str): paragraphs=[paragraphs]
        bullets = section.get('bullets') or section.get('lista') or []
        if isinstance(bullets, str): bullets=[bullets]
        normalized.append({'heading':str(section.get('heading') or section.get('titulo') or '').strip(), 'paragraphs':[str(x).strip() for x in paragraphs if str(x).strip()], 'bullets':[str(x).strip() for x in bullets if str(x).strip()]})
    a['sections']=normalized
    faq = a.get('faq') or a.get('perguntas_frequentes') or []
    a['faq']=[{'question':str(x.get('question') or x.get('pergunta') or '').strip(),'answer':str(x.get('answer') or x.get('resposta') or '').strip()} for x in faq if isinstance(x,dict)]
    a['slug'] = slugify(str(a.get('slug') or a['title']))
    return a

def validate(a: dict[str, Any]) -> None:
    required=('title','description','intro','conclusion','slug')
    missing=[x for x in required if not a.get(x)]
    if missing: raise RuntimeError('Artigo sem campos obrigatórios: '+', '.join(missing))
    if len(a['title']) > 90: raise RuntimeError('Título maior que 90 caracteres.')
    if len(a['description']) > 170: raise RuntimeError('Meta description maior que 170 caracteres.')
    if len(a['sections']) < 3: raise RuntimeError('O artigo precisa de pelo menos 3 seções.')
    if any(not x['heading'] or not x['paragraphs'] for x in a['sections']): raise RuntimeError('Cada seção precisa de título e pelo menos um parágrafo.')

def nav_html() -> str:
    return '''<div class="site-navigation" role="navigation" aria-label="Navegação principal"><div class="nav-inner"><a class="brand" href="/"><span>DG</span> DoceGestor</a><nav><a href="/">Início</a><a href="/blog/">Blog</a><a href="/receitas/">Receitas</a><a href="/ebooks/">E-books</a><a class="cta" href="%s" target="_blank" rel="sponsored noopener">Conhecer o app</a></nav></div></div><div class="resource-strip"><strong>Encontre no site:</strong><a href="/receitas/">Receitas de doces e bolos</a><a href="/blog/">Guias para confeiteiras</a><a href="/ebooks/">E-books em PDF</a></div>''' % MARKET_URL

def render(a: dict[str, Any], published: str, related: list[dict[str, Any]]) -> str:
    canonical=f'{BASE_URL}/blog/{a["slug"]}/'
    sections=[]
    for i, section in enumerate(a['sections']):
        bullets=''.join(f'<li>{esc(x)}</li>' for x in section['bullets'])
        list_html=f'<ul>{bullets}</ul>' if bullets else ''
        paragraphs=''.join(f'<p>{esc(p)}</p>' for p in section['paragraphs'])
        sections.append(f'<section id="sec-{i}" class="article-section"><h2>{esc(section["heading"])}</h2>{paragraphs}{list_html}</section>')
    faq=''.join(f'<h3>{esc(x["question"])}</h3><p>{esc(x["answer"])}</p>' for x in a['faq'] if x['question'] and x['answer'])
    faq_html=f'<section class="article-section faq-section"><h2>Perguntas frequentes</h2>{faq}</section>' if faq else ''
    related_html=''.join(f'<li><a href="/blog/{esc(x["slug"])}/">{esc(x["title"])}</a></li>' for x in related[:4])
    schema={'@context':'https://schema.org','@type':'BlogPosting','headline':a['title'],'description':a['description'],'datePublished':published,'dateModified':published,'author':{'@type':'Organization','name':'DoceGestor'},'mainEntityOfPage':canonical}
    style='''body{margin:0;background:#fffaf8;color:#3b1f1b;font:17px/1.75 Arial,sans-serif}.site-navigation{background:#fffaf8;border-bottom:1px solid #f2d9d1;box-shadow:0 2px 12px #3b1f1b0d;font-family:Arial,sans-serif}.nav-inner{max-width:1152px;min-height:66px;margin:auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{color:#3b1f1b;text-decoration:none;font-weight:800;font-size:18px;white-space:nowrap}.brand span{color:#e65f47}nav{display:flex;align-items:center;gap:6px;flex-wrap:wrap}nav a{color:#5b3a35;text-decoration:none;font-size:14px;font-weight:600;padding:8px 10px;border-radius:8px}nav a:hover{background:#fff1ed;color:#d9553c}nav .cta{background:#e65f47;color:#fff;padding:9px 14px}.resource-strip{max-width:1152px;margin:auto;padding:14px 24px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-family:Arial,sans-serif}.resource-strip strong{font-size:13px;color:#806b65}.resource-strip a{border:1px solid #f2cfc5;background:#fff1ed;border-radius:999px;padding:6px 11px;color:#6b4038;text-decoration:none;font-size:13px;font-weight:700}main,footer{max-width:920px;margin:auto;padding:24px}h1{font:700 46px/1.12 Georgia,serif;margin:8px 0 18px}h2{font:700 29px Georgia,serif;margin-top:36px}h3{font-size:20px;margin-top:24px}a{color:#d9553c}.tag{color:#d9553c;text-transform:uppercase;font-size:13px;font-weight:bold;letter-spacing:.08em}.lead{font-size:21px;color:#654a45}.meta{font-size:14px;color:#806b65}.toc,.cta{background:#fff1ed;border:1px solid #f2cfc5;border-radius:16px;padding:18px 24px;margin:28px 0}footer{border-top:1px solid #f2d9d1;margin-top:48px;color:#806b65;font-size:14px}@media(max-width:650px){.nav-inner{align-items:flex-start;flex-direction:column;padding-top:13px;padding-bottom:13px}nav a{font-size:13px;padding:7px 8px}h1{font-size:36px}}'''
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><meta name="author" content="DoceGestor"><title>{esc(a['title'])} | DoceGestor</title><meta name="description" content="{esc(a['description'])}"><link rel="canonical" href="{canonical}"><meta property="og:type" content="article"><meta property="og:title" content="{esc(a['title'])}"><meta property="og:description" content="{esc(a['description'])}"><meta property="og:url" content="{canonical}"><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script><style>{style}</style></head><body>{nav_html()}<main><div class="tag">{esc(a['category'])}</div><h1>{esc(a['title'])}</h1><p class="lead">{esc(a['intro'])}</p><p class="meta">Publicado em {published} · Equipe DoceGestor</p><div class="toc"><strong>Neste artigo</strong><ul>{''.join(f'<li><a href="#sec-{i}">{esc(s["heading"])}</a></li>' for i,s in enumerate(a['sections']))}</ul></div>{''.join(sections)}{faq_html}<section class="article-section"><h2>Conclusão</h2><p>{esc(a['conclusion'])}</p></section><section class="cta"><strong>Quer simplificar a rotina da sua confeitaria?</strong><p>Conheça o DoceGestor para acompanhar custos, vendas e lucro em um só lugar.</p><p><a href="{MARKET_URL}" rel="sponsored noopener">Conhecer o app →</a></p></section><section><h2>Leia também</h2><ul>{related_html}</ul></section></main><footer>DoceGestor · Gestão para confeitarias · <a href="/">Página inicial</a></footer></body></html>'''

def update_blog_index(registry: list[dict[str, Any]]) -> None:
    path=ROOT/'blog/index.html'; text=path.read_text(encoding='utf-8')
    if MARK_START not in text or MARK_END not in text: raise RuntimeError('blog/index.html não contém os marcadores da listagem automática.')
    cards=''.join(f'<a href="/blog/{esc(x["slug"])}/" class="automated-card"><small>{esc(x.get("category","Gestão"))}</small><strong>{esc(x["title"])}</strong><span>{esc(x["description"])}</span><b>Ler artigo →</b></a>' for x in registry[:12])
    block=f'''{MARK_START}<section id="automated-articles" class="automated-articles"><h2>Artigos novos</h2><div class="automated-articles-list">{cards}</div></section>{MARK_END}<script id="automated-blog-placement">(function(){{function place(){{var section=document.getElementById('automated-articles');var footer=document.querySelector('#root .site-footer');if(section&&footer&&footer.parentNode&&section.parentNode!==footer.parentNode){{footer.parentNode.insertBefore(section,footer);return true}}return false}}if(!place()){{var root=document.getElementById('root');if(root){{var observer=new MutationObserver(place);observer.observe(root,{{childList:true,subtree:true}})}}}}}})();</script>'''
    text=text.split(MARK_START,1)[0]+block+text.split(MARK_END,1)[1]
    # O script anterior fazia cards via JS; a lista agora é HTML permanente.
    text=re.sub(r'<script id="automated-blog-sync">.*?</script>','',text,flags=re.S)
    path.write_text(text,encoding='utf-8')

def update_sitemap(registry: list[dict[str, Any]]) -> None:
    path=ROOT/'sitemap.xml'; text=path.read_text(encoding='utf-8')
    text=re.sub(r'\s*<url><loc>https://docegestor\.github\.io/blog/[^<]+</loc>.*?</url>','',text,flags=re.S)
    entries=''.join(f'  <url><loc>{BASE_URL}/blog/{esc(x["slug"])}/</loc><lastmod>{x["published"]}</lastmod><priority>0.8</priority></url>\n' for x in registry)
    path.write_text(text.replace('</urlset>',entries+'</urlset>'),encoding='utf-8')

def main() -> int:
    ap=argparse.ArgumentParser(); ap.add_argument('--limit',type=int,default=1); ap.add_argument('--input',type=Path); ap.add_argument('--dry-run',action='store_true'); args=ap.parse_args()
    if args.limit < 0 or args.limit > 3: raise RuntimeError('--limit deve estar entre 0 e 3.')
    raw=load_json(args.input,[]) if args.input else load_json(QUEUE,[])
    if isinstance(raw,dict): raw=[raw]
    registry=load_json(REGISTRY,[])
    known={x.get('slug') for x in registry}
    # Migra o catálogo antigo de IA para o mesmo índice do blog, sem criar outra rota.
    for old in load_json(LEGACY_REGISTRY,[]):
        if old.get('slug') and old['slug'] not in known:
            registry.append({'slug':old['slug'],'title':old.get('title',''),'description':old.get('description',''),'category':old.get('category','Gestão'),'published':old.get('published',dt.date.today().isoformat())})
            known.add(old['slug'])
    used={x.get('slug') for x in registry}
    pending=[]
    for item in raw:
        a=normalize_article(item); validate(a)
        if a['slug'] not in used: pending.append(a)
    selected=pending[:args.limit]; today=dt.date.today().isoformat()
    if args.dry_run:
        for a in selected: render(a,today,registry)
        print(f'Artigos validados (dry-run): {len(selected)}'); return 0
    for a in selected:
        out=ROOT/'blog'/a['slug']; out.mkdir(parents=True,exist_ok=False)
        (out/'index.html').write_text(render(a,today,registry),encoding='utf-8')
        registry.insert(0,{'slug':a['slug'],'title':a['title'],'description':a['description'],'category':a['category'],'published':today})
    if selected or registry != load_json(REGISTRY,[]):
        REGISTRY.write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); update_blog_index(registry); update_sitemap(registry)
    print(f'Artigos publicados no blog: {len(selected)}'); return 0

if __name__=='__main__': raise SystemExit(main())

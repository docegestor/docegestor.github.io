#!/usr/bin/env python3
"""Rebuild the static editorial shell while preserving generated content and data."""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://docegestor.github.io"
MARKET_URL = "https://www.mercadolivre.com.br/docegestor-sistema-para-confeitaria--precificacao-e-vendas/up/MLBU4686356819?pdp_filters=item_id:MLB7401439782"
TELEGRAM_URL = "https://t.me/docelucro"
WHATSAPP_URL = "https://wa.me/5511999999999"


def esc(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def nav(active: str = "") -> str:
    links = [("Início", "/"), ("Blog", "/blog/"), ("Receitas", "/receitas/"), ("E-books", "/ebooks/")]
    items = "".join(
        f'<a class="{"is-active" if active == label else ""}" href="{url}">{label}</a>'
        for label, url in links
    )
    return f'''<header class="site-header"><div class="site-header-inner">
      <a class="site-brand" href="/"><span class="brand-mark">DG</span><span>DoceGestor</span></a>
      <nav class="site-nav" aria-label="Navegação principal">{items}<a class="nav-cta" href="{MARKET_URL}" target="_blank" rel="sponsored noopener">Conhecer o app</a></nav>
    </div></header>'''


def footer() -> str:
    return f'''<section class="community-callout"><div><p class="eyebrow">Doce &amp; Lucro</p><h2>Ideias práticas para sua confeitaria.</h2><p>Receba conteúdos curtos sobre produção, vendas e organização.</p></div><a class="button button-light" href="{TELEGRAM_URL}" target="_blank" rel="noopener">Entrar na comunidade <span aria-hidden="true">→</span></a></section>
<footer class="site-footer"><div class="footer-grid"><div><a class="footer-brand" href="/"><span class="brand-mark">DG</span><span>DoceGestor</span></a><p>Gestão, receitas e recursos para confeiteiras.</p></div><div><h3>Explorar</h3><a href="/">O app</a><a href="/blog/">Blog</a><a href="/receitas/">Receitas</a><a href="/ebooks/">E-books</a></div><div><h3>Comunidade</h3><a href="{TELEGRAM_URL}" target="_blank" rel="noopener">Telegram Doce &amp; Lucro</a><a href="{WHATSAPP_URL}" target="_blank" rel="noopener">Grupo no WhatsApp</a></div><div><h3>Comprar</h3><a href="{MARKET_URL}" target="_blank" rel="sponsored noopener">Comprar no Mercado Livre</a></div></div><div class="footer-bottom"><span>© 2026 DoceGestor · Dados locais no seu aparelho</span><span>Desenvolvido por <a href="https://saulomgg.github.io" target="_blank" rel="noopener">Saulo</a></span></div></footer>'''


def shell(title: str, description: str, body: str, active: str = "", canonical: str | None = None, kind: str = "website", schema: str = "") -> str:
    canonical = canonical or BASE_URL + "/"
    schema_tag = f'<script type="application/ld+json">{schema}</script>' if schema else ""
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f4775b"><meta name="robots" content="index,follow"><meta name="author" content="DoceGestor"><meta name="description" content="{esc(description)}"><title>{esc(title)}</title><link rel="canonical" href="{esc(canonical)}"><meta property="og:type" content="{kind}"><meta property="og:site_name" content="DoceGestor"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{esc(canonical)}"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="/assets/editorial.css">{schema_tag}</head><body class="editorial-page">{nav(active)}{body}{footer()}</body></html>'''


def extract_main(text: str) -> str:
    match = re.search(r"<main\b[^>]*>(.*?)</main>", text, flags=re.I | re.S)
    if not match:
        raise RuntimeError("Página sem elemento main")
    return match.group(1).strip()


def meta(text: str, name: str, default: str) -> str:
    match = re.search(rf'<meta\s+name="{re.escape(name)}"\s+content="([^"]*)"', text, flags=re.I)
    return match.group(1) if match else default


def title(text: str, default: str) -> str:
    match = re.search(r"<title>(.*?)</title>", text, flags=re.I | re.S)
    return re.sub(r"\s+", " ", match.group(1)).strip() if match else default


def migrate_details(directory: str, active: str) -> int:
    count = 0
    for path in sorted((ROOT / directory).glob("*/index.html")):
        text = path.read_text(encoding="utf-8")
        if not re.search(r"<main\b", text, flags=re.I):
            # Legacy entries are rendered by the preserved React bundle. Remove only
            # the old injected shell; the app keeps ownership of their content/layout.
            text = re.sub(r'\s*<style id="site-navigation-style">.*?</style>', '', text, count=1, flags=re.S)
            text = re.sub(r'<div id="site-navigation".*?</div></div><div class="site-resource-strip".*?</div>\s*', '', text, count=1, flags=re.S)
            text = text.replace('<link rel="stylesheet" crossorigin href="/assets/index-D6y4RxRJ.css">', '<link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" crossorigin href="/assets/index-D6y4RxRJ.css"><link rel="stylesheet" href="/assets/editorial.css">')
            path.write_text(text, encoding="utf-8")
            count += 1
            continue
        content = extract_main(text)
        # Old generated pages already contain article/recipe semantic content; only the shell is replaced.
        content = re.sub(r'^\s*<div class="site-navigation".*?</div>\s*<div class="resource-strip".*?</div>\s*', '', content, flags=re.S)
        rel = path.parent.relative_to(ROOT).as_posix() + "/"
        new = shell(title(text, "DoceGestor"), meta(text, "description", "Conteúdo DoceGestor para confeiteiras."), f'<main class="article-main"><div class="content-back"><a href="/{active.lower()}/">← Voltar para {active.lower()}</a></div>{content}</main>', active, BASE_URL + "/" + rel, "article")
        path.write_text(new, encoding="utf-8")
        count += 1
    return count


def load_json(path: Path, default):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def blog_index(registry=None) -> None:
    registry = registry if registry is not None else load_json(ROOT / "data/artigos_publicados_estaticos.json", [])
    cards = "".join(f'<a class="blog-card" href="/blog/{esc(x["slug"])}/"><small>{esc(x.get("category", "Gestão"))}</small><strong>{esc(x.get("title"))}</strong><span>{esc(x.get("description"))}</span><b>Ler artigo <span aria-hidden="true">→</span></b></a>' for x in registry[:18])
    body = f'''<main class="editorial-wrap"><section class="editorial-hero"><div class="editorial-hero-content"><p class="eyebrow">Conteúdo para fazer seu negócio crescer</p><h1>Ideias doces. Decisões mais lucrativas.</h1><p>Guias claros para precificar, organizar pedidos e transformar a rotina da confeitaria em um negócio mais leve.</p><div class="hero-pills"><span>Precificação sem complicação</span><span>Organização da produção</span><span>Vendas com mais segurança</span></div></div></section><section class="blog-grid"><div class="section-heading"><p class="eyebrow">Artigos recentes</p><h2>Mais segurança para decidir e vender</h2><p>Conteúdo direto ao ponto para cuidar dos custos, da produção e do lucro.</p></div>{cards}</section></main>'''
    (ROOT / "blog/index.html").write_text(shell("Blog DoceGestor | Precificação e gestão para confeitaria", "Guias práticos para precificação, organização e lucro na confeitaria.", body, "Blog", BASE_URL + "/blog/"), encoding="utf-8")


def recipes_index(registry=None) -> None:
    registry = registry if registry is not None else load_json(ROOT / "data/receitas_publicadas.json", [])
    cards = "".join(f'<a class="blog-card recipe-card" href="/receitas/{esc(x["slug"])}/"><small>{esc(x.get("category", "Receitas"))}</small><strong>{esc(x.get("title"))}</strong><span>{esc(x.get("description"))}</span><b>Ver receita <span aria-hidden="true">→</span></b></a>' for x in registry)
    body = f'''<main class="editorial-wrap"><section class="editorial-hero"><div class="editorial-hero-content"><p class="eyebrow">Receitas para testar e vender</p><h1>Mais sabor na produção. Mais clareza na rotina.</h1><p>Receitas organizadas para você preparar, padronizar e transformar boas ideias em encomendas bem feitas.</p><div class="hero-pills"><span>Ingredientes organizados</span><span>Preparo passo a passo</span><span>Dicas para produção</span></div></div></section><section class="blog-grid"><div class="section-heading"><p class="eyebrow">Acervo de receitas</p><h2>Doces, bolos e preparos para sua cozinha</h2><p>Salve suas favoritas e adapte cada preparo ao seu jeito de produzir.</p></div>{cards}</section></main>'''
    (ROOT / "receitas/index.html").write_text(shell("Receitas de doces e bolos | DoceGestor", "Receitas organizadas de doces, bolos e preparos para a rotina de confeitaria.", body, "Receitas", BASE_URL + "/receitas/"), encoding="utf-8")


def ebooks_index() -> None:
    books = load_json(ROOT / "ebooks/ebooks.json", [])
    cards = "".join(f'<article class="ebook-card"><div class="ebook-cover"><span>PDF</span><strong>{esc(x.get("category", "Confeitaria"))}</strong></div><div class="ebook-body"><p class="eyebrow">E-book de receitas</p><h2>{esc(x.get("title"))}</h2><p>{esc(x.get("description"))}</p><ul class="quick-info"><li>Download em PDF</li><li>Leitura no celular ou computador</li></ul><a class="button button-primary" href="/ebooks/arquivos/{esc(x.get("filename"))}" target="_blank" rel="noopener">Abrir e-book <span aria-hidden="true">→</span></a></div></article>' for x in books)
    body = f'''<main class="ebook-main"><section class="editorial-hero"><div class="editorial-hero-content"><p class="eyebrow">Biblioteca DoceGestor</p><h1>Conhecimento gostoso para abrir novas possibilidades.</h1><p>Encontre e-books em PDF para estudar, se inspirar e ampliar seu repertório de doces, bolos e sobremesas.</p><div class="hero-pills"><span>PDF para baixar</span><span>Leitura no celular</span><span>Conteúdo para confeitaria</span></div></div></section><section class="section-heading ebook-heading"><p class="eyebrow">Acervo digital</p><h2>Escolha seu próximo material</h2><p>Uma biblioteca simples para consultar, salvar e voltar quando surgir uma nova ideia para a cozinha.</p></section><section class="ebook-grid">{cards}</section></main>'''
    (ROOT / "ebooks/index.html").write_text(shell("E-books de receitas para baixar em PDF | DoceGestor", "Biblioteca de e-books em PDF com receitas de doces, bolos, sobremesas e confeitaria.", body, "E-books", BASE_URL + "/ebooks/"), encoding="utf-8")


def main() -> None:
    blog_index(); recipes_index(); ebooks_index()
    migrated_blog = migrate_details("blog", "Blog")
    migrated_legacy = migrate_details("artigos", "Blog")
    migrated_recipes = migrate_details("receitas", "Receitas")
    print(f"Índices reconstruídos; páginas migradas: blog={migrated_blog}, artigos={migrated_legacy}, receitas={migrated_recipes}")


if __name__ == "__main__":
    main()

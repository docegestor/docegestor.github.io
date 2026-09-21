#!/usr/bin/env python3
"""Aplica, uma única vez, o novo favicon/rodapé às páginas que já
estavam publicadas antes da correção do layout compartilhado
(site_layout.py). Depois desta execução, publicar_artigo_estatico.py
e publicar_receitas.py já cuidam disso sozinhos em toda postagem nova.
"""
from __future__ import annotations
import re
from pathlib import Path

from site_layout import head_extra, nav_html, footer_html

ROOT = Path(__file__).resolve().parents[1]

OLD_ARTICLE_NAV_RE = re.compile(
    r'<div class="site-navigation" role="navigation".*?</div><div class="resource-strip">.*?</div>',
    re.S,
)
OLD_ARTICLE_FOOTER_RE = re.compile(r"<footer>DoceGestor · Gestão para confeitarias.*?</footer>", re.S)

OLD_RECIPE_HEADER_RE = re.compile(
    r'<header><a href="/receitas/">Receitas DoceGestor</a><nav>.*?</nav></header>', re.S
)
OLD_RECIPE_ARTICLE_FOOTER_RE = re.compile(
    r"<footer>Receitas autorais e conteúdo editorial do DoceGestor\.</footer>"
)
OLD_RECIPE_INDEX_FOOTER_RE = re.compile(
    r"<footer>DoceGestor · Receitas e gestão para confeiteiras</footer>"
)


def add_head_extra(html: str) -> str:
    if "site-footer-style" in html:
        return html  # já aplicado
    return html.replace("</head>", head_extra() + "</head>", 1)


def patch_blog_article(path: Path) -> None:
    html = path.read_text(encoding="utf-8")
    html = add_head_extra(html)
    html = OLD_ARTICLE_NAV_RE.sub(nav_html(), html, count=1)
    html = OLD_ARTICLE_FOOTER_RE.sub(footer_html(), html, count=1)
    path.write_text(html, encoding="utf-8")


def patch_blog_index(path: Path) -> None:
    html = path.read_text(encoding="utf-8")
    html = add_head_extra(html)
    if "site-footer-simple" not in html:
        html = html.replace("</body>", footer_html() + "</body>", 1)
    path.write_text(html, encoding="utf-8")


def patch_recipe_article(path: Path) -> None:
    html = path.read_text(encoding="utf-8")
    html = add_head_extra(html)
    html = OLD_RECIPE_HEADER_RE.sub(nav_html(), html, count=1)
    html = OLD_RECIPE_ARTICLE_FOOTER_RE.sub(footer_html(), html, count=1)
    path.write_text(html, encoding="utf-8")


def patch_recipe_index(path: Path) -> None:
    html = path.read_text(encoding="utf-8")
    html = add_head_extra(html)
    html = OLD_RECIPE_INDEX_FOOTER_RE.sub(footer_html(), html, count=1)
    path.write_text(html, encoding="utf-8")


def add_favicon_only(path: Path) -> None:
    html = path.read_text(encoding="utf-8")
    if "rel=\"icon\"" in html:
        return
    from site_layout import FAVICON_LINK
    html = html.replace("</head>", FAVICON_LINK + "</head>", 1)
    path.write_text(html, encoding="utf-8")


def main() -> None:
    for article in sorted((ROOT / "blog").glob("*/index.html")):
        patch_blog_article(article)
        print("blog artigo:", article.parent.name)

    patch_blog_index(ROOT / "blog" / "index.html")
    print("blog/index.html: favicon + rodapé adicionados")

    for recipe in sorted((ROOT / "receitas").glob("*/index.html")):
        patch_recipe_article(recipe)
        print("receita:", recipe.parent.name)

    patch_recipe_index(ROOT / "receitas" / "index.html")
    print("receitas/index.html: favicon + rodapé padronizados")

    # Páginas mantidas manualmente: só recebem o favicon, sem mexer no
    # cabeçalho/rodapé próprios delas (ex.: ebooks tem um rodapé com
    # link de afiliado do PDFGestor que não deve ser removido).
    for extra in ["index.html", "404.html", "ebooks/index.html"]:
        p = ROOT / extra
        if p.exists():
            add_favicon_only(p)
            print("favicon adicionado:", extra)


if __name__ == "__main__":
    main()

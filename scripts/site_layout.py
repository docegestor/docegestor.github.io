#!/usr/bin/env python3
"""Layout compartilhado do site (cabeçalho, rodapé, favicon).

Este módulo existe para que TODAS as páginas geradas automaticamente
(artigos do blog e receitas) usem exatamente o mesmo cabeçalho e o
mesmo rodapé do restante do site — inclusive quando novas postagens
forem publicadas no futuro.

Se o menu, o rodapé ou o favicon do site mudarem, mude só aqui.
Não edite o cabeçalho/rodapé dentro de publicar_artigo_estatico.py
ou publicar_receitas.py — importe deste arquivo.
"""
from __future__ import annotations

MARKET_URL = "https://www.mercadolivre.com.br/docegestor-sistema-para-confeitaria--precificacao-e-vendas/up/MLBU4686356819?pdp_filters=item_id:MLB7401439782"
DEV_URL = "https://saulomgg.github.io"
DEV_NAME = "saulomgg"

# Favicon simples embutido (sem precisar versionar um arquivo .ico/.png).
FAVICON_LINK = (
    '<link rel="icon" '
    'href="data:image/svg+xml,'
    '%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E'
    '%3Ctext y=%22.9em%22 font-size=%2290%22%3E%F0%9F%A7%81%3C/text%3E%3C/svg%3E">'
)

# CSS do cabeçalho — igual ao usado em index.html / blog/index.html / receitas/index.html.
NAV_STYLE = """<style id="site-navigation-style">
#site-navigation{position:relative;z-index:20;background:#fffaf8;border-bottom:1px solid #f2d9d1;box-shadow:0 2px 12px rgba(59,31,27,.05);font-family:DM Sans,Arial,sans-serif}
#site-navigation .site-nav-inner{max-width:1152px;margin:0 auto;min-height:66px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:24px}
#site-navigation .site-brand{color:#3b1f1b;text-decoration:none;font-weight:800;font-size:18px;white-space:nowrap}
#site-navigation .site-brand span{color:#e65f47}
#site-navigation .site-links{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap}
#site-navigation .site-links a{color:#5b3a35;text-decoration:none;font-size:14px;font-weight:600;padding:8px 10px;border-radius:8px}
#site-navigation .site-links a:hover,#site-navigation .site-links a:focus{background:#fff1ed;color:#d9553c}
#site-navigation .site-links .site-primary-cta{background:#e65f47;color:#fff;padding:9px 14px}
#site-navigation .site-links .site-primary-cta:hover{background:#c94f3b;color:#fff}
.site-resource-strip{max-width:1152px;margin:0 auto;padding:14px 24px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-family:DM Sans,Arial,sans-serif}
.site-resource-strip strong{font-size:13px;color:#806b65;margin-right:4px}
.site-resource-strip a{display:inline-flex;align-items:center;gap:5px;border:1px solid #f2cfc5;background:#fff1ed;border-radius:999px;padding:6px 11px;color:#6b4038;text-decoration:none;font-size:13px;font-weight:700}
.site-resource-strip a:hover{background:#ffe2d9;color:#d9553c}
@media(max-width:720px){#site-navigation .site-nav-inner{align-items:flex-start;flex-direction:column;gap:8px;padding-top:13px;padding-bottom:13px}#site-navigation .site-links{justify-content:flex-start;gap:2px}#site-navigation .site-links a{font-size:13px;padding:7px 8px}.site-resource-strip{padding-top:12px;padding-bottom:12px}}
</style>"""

# CSS do rodapé canônico (novo — unifica o rodapé em todo o site estático).
FOOTER_STYLE = """<style id="site-footer-style">
.site-footer-simple{border-top:1px solid #f2d9d1;margin-top:48px;background:#fffaf8;font-family:DM Sans,Arial,sans-serif}
.site-footer-simple .site-footer-inner{max-width:1152px;margin:0 auto;padding:28px 24px;display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center}
.site-footer-simple .site-footer-links{display:flex;gap:16px;flex-wrap:wrap;justify-content:center}
.site-footer-simple .site-footer-links a{color:#5b3a35;text-decoration:none;font-size:14px;font-weight:600}
.site-footer-simple .site-footer-links a:hover{color:#d9553c}
.site-footer-simple .site-footer-credit{margin:0;font-size:13px;color:#806b65}
.site-footer-simple .site-footer-credit a{color:#d9553c;text-decoration:none;font-weight:600}
.site-footer-simple .site-footer-credit a:hover{text-decoration:underline}
</style>"""


def head_extra() -> str:
    """Favicon + CSS do cabeçalho e do rodapé, para colar dentro de <head>."""
    return FAVICON_LINK + NAV_STYLE + FOOTER_STYLE


def nav_html() -> str:
    """O cabeçalho/menu, idêntico em toda página do site."""
    return (
        '<div id="site-navigation" role="navigation" aria-label="Navegação principal">'
        '<div class="site-nav-inner">'
        '<a class="site-brand" href="/"><span>DG</span> DoceGestor</a>'
        '<nav class="site-links">'
        '<a href="/">Início</a>'
        '<a href="/blog/">Blog</a>'
        '<a href="/receitas/">Receitas</a>'
        '<a href="/ebooks/">E-books</a>'
        f'<a class="site-primary-cta" href="{MARKET_URL}" target="_blank" rel="sponsored noopener">Conhecer o app</a>'
        '</nav></div></div>'
        '<div class="site-resource-strip" aria-label="Atalhos de conteúdo">'
        '<strong>Encontre no site:</strong>'
        '<a href="/receitas/">Receitas de doces e bolos</a>'
        '<a href="/blog/">Guias para confeiteiras</a>'
        '<a href="/ebooks/">E-books em PDF</a>'
        '</div>'
    )


def footer_html() -> str:
    """O rodapé, idêntico em toda página do site, com o crédito de desenvolvimento."""
    return (
        '<footer class="site-footer-simple"><div class="site-footer-inner">'
        '<nav class="site-footer-links">'
        '<a href="/">Início</a>'
        '<a href="/blog/">Blog</a>'
        '<a href="/receitas/">Receitas</a>'
        '<a href="/ebooks/">E-books</a>'
        '</nav>'
        '<p class="site-footer-credit">© 2026 DoceGestor · Desenvolvido por '
        f'<a href="{DEV_URL}" target="_blank" rel="noopener">{DEV_NAME}</a></p>'
        '</div></footer>'
    )

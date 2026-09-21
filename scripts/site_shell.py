from pathlib import Path
import re

MARKET = 'https://www.mercadolivre.com.br/docegestor-sistema-para-confeitaria--precificacao-e-vendas/up/MLBU4686356819?pdp_filters=item_id:MLB7401439782'
NAV = f'''<div id="site-navigation" role="navigation" aria-label="Navegação principal"><div class="site-nav-inner"><a class="site-brand" href="/"><span>DG</span> DoceGestor</a><nav class="site-links"><a href="/">Início</a><a href="/blog/">Blog</a><a href="/receitas/">Receitas</a><a href="/ebooks/">E-books</a><a class="site-primary-cta" href="{MARKET}" target="_blank" rel="sponsored noopener">Conhecer o app</a></nav></div></div><div class="site-resource-strip" aria-label="Atalhos de conteúdo"><strong>Encontre no site:</strong><a href="/receitas/">Receitas de doces e bolos</a><a href="/blog/">Guias para confeiteiras</a><a href="/ebooks/">E-books em PDF</a></div>'''
FOOTER = f'''<footer class="site-footer"><div class="site-footer-grid"><div><a class="site-footer-brand" href="/"><span>DG</span> DoceGestor</a><p class="site-footer-title">Precifique. Venda. Lucre.</p><p class="site-footer-muted">Gestão para confeitarias que querem enxergar o valor de cada encomenda.</p></div><div><h3>Explorar</h3><a href="/#app">O app</a><a href="/#recursos">Recursos</a><a href="/blog/">Blog</a></div><div><h3>Comprar</h3><a href="{MARKET}" target="_blank" rel="noreferrer">Comprar no Mercado Livre</a><a href="https://wa.me/" target="_blank" rel="noreferrer">Falar pelo WhatsApp</a><a href="/">Todos os aplicativos</a></div><div><h3>Comunidade</h3><a href="https://t.me/docelucro" target="_blank" rel="noreferrer">Telegram Doce &amp; Lucro</a><a href="https://chat.whatsapp.com/F1VTtZpiYFCIE80vgOjdGt?s=cl&amp;p=a&amp;ilr=1" target="_blank" rel="noreferrer">Grupo no WhatsApp</a><p class="site-footer-muted">Acesso vitalício · sem mensalidade · sem anúncios</p></div></div><div class="site-footer-bottom"><span>© 2026 DoceGestor · feito com carinho por Saulo</span><span>Dados locais no seu aparelho</span><span>Desenvolvido por <a href="https://saulomgg.github.io" target="_blank" rel="noopener noreferrer">saulomgg</a></span></div></footer>'''
CSS = '''<style id="home-shell-style">#site-navigation{position:relative;z-index:20;background:#fffaf8;border-bottom:1px solid #f2d9d1;box-shadow:0 2px 12px rgba(59,31,27,.05);font-family:DM Sans,Arial,sans-serif}#site-navigation .site-nav-inner{max-width:1152px;margin:0 auto;min-height:66px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:24px}#site-navigation .site-brand{color:#3b1f1b;text-decoration:none;font-weight:800;font-size:18px;white-space:nowrap}#site-navigation .site-brand span,.site-footer-brand span{color:#e65f47}#site-navigation .site-links{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap}#site-navigation .site-links a{color:#5b3a35;text-decoration:none;font-size:14px;font-weight:600;padding:8px 10px;border-radius:8px}#site-navigation .site-links a:hover{background:#fff1ed;color:#d9553c}#site-navigation .site-links .site-primary-cta{background:#e65f47;color:#fff;padding:9px 14px}.site-resource-strip{max-width:1152px;margin:0 auto;padding:14px 24px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-family:DM Sans,Arial,sans-serif}.site-resource-strip strong{font-size:13px;color:#806b65;margin-right:4px}.site-resource-strip a{display:inline-flex;align-items:center;gap:5px;border:1px solid #f2cfc5;background:#fff1ed;border-radius:999px;padding:6px 11px;color:#6b4038;text-decoration:none;font-size:13px;font-weight:700}.site-footer{margin-top:40px;background:#3b1f1b;color:#fff7f3;padding:46px 24px 22px;font-family:DM Sans,Arial,sans-serif}.site-footer-grid{max-width:1152px;margin:0 auto;display:grid;grid-template-columns:1.5fr 1fr 1.2fr 1.3fr;gap:32px}.site-footer-brand{color:#fff7f3;text-decoration:none;font-weight:800;font-size:20px}.site-footer-title{font:700 22px Playfair Display,Georgia,serif;margin:18px 0 8px}.site-footer-muted{color:#d8bdb4;font-size:13px;line-height:1.6}.site-footer h3{font-size:14px;margin:0 0 12px;color:#fff}.site-footer-grid>div>a:not(.site-footer-brand){display:block;color:#f6ddd5;text-decoration:none;font-size:14px;margin:8px 0}.site-footer-bottom{max-width:1152px;margin:34px auto 0;padding-top:18px;border-top:1px solid #6c4d46;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;color:#d8bdb4;font-size:12px}.site-footer-bottom a{color:#fff7f3;text-decoration:none}@media(max-width:800px){#site-navigation .site-nav-inner{align-items:flex-start;flex-direction:column;gap:8px;padding-top:13px;padding-bottom:13px}.#site-navigation .site-links{justify-content:flex-start;gap:2px}.site-resource-strip{padding-top:12px;padding-bottom:12px}.site-footer-grid{grid-template-columns:1fr 1fr}.site-footer-bottom{display:block}.site-footer-bottom span{display:block;margin-top:8px}}@media(max-width:520px){.site-footer-grid{grid-template-columns:1fr}}</style>'''

def _remove_div(text, marker):
    while marker in text:
        start = text.rfind('<div', 0, text.find(marker)+1)
        depth = 0
        for m in re.finditer(r'<div\b[^>]*>|</div\s*>', text[start:], re.I):
            depth += 1 if m.group(0).lower().startswith('<div') else -1
            if depth == 0:
                text = text[:start] + text[start + m.end():]
                break
        else: break
    return text

def normalize(text: str) -> str:
    text = _remove_div(text, 'id="site-navigation"')
    text = _remove_div(text, 'https://t.me/docelucro')
    text = _remove_div(text, 'https://t.me/docelucro')
    text = re.sub(r'<div\b[^>]*class="[^"]*(?:dl-topbar|topbar)[^"]*"[^>]*>.*?</div\s*>', '', text, flags=re.I|re.S)
    text = re.sub(r'<header\b[^>]*>.*?</header\s*>', '', text, flags=re.I|re.S)
    text = re.sub(r'<div\b[^>]*class="[^"]*site-resource-strip[^"]*"[^>]*>.*?</div\s*>', '', text, flags=re.I|re.S)
    text = re.sub(r'<footer\b[^>]*>.*?</footer\s*>', '', text, count=1, flags=re.I|re.S)
    text = re.sub(r'<style id="(?:home-shell-style|doce-lucro-shell)">.*?</style>', '', text, flags=re.I|re.S)
    text = text.replace('</head>', CSS + '</head>', 1)
    text = re.sub(r'(<body\b[^>]*>)', r'\1' + NAV, text, count=1, flags=re.I)
    text = text.replace('</body>', FOOTER + '</body>', 1)
    return text

def normalize_file(path: Path):
    path.write_text(normalize(path.read_text(encoding='utf-8')), encoding='utf-8')

from pathlib import Path

path = Path(__file__).resolve().parents[1] / "index.html"
text = path.read_text(encoding="utf-8")

style = '''<style id="home-tuning">
.home-library{padding:76px 0 68px;background:#fffaf8}
.home-library .container{max-width:1160px}
.home-library-heading{display:flex;align-items:end;justify-content:space-between;gap:28px;margin-bottom:28px}
.home-library-heading h2{margin:8px 0 0;color:#3b1f1b;font:700 clamp(32px,4vw,50px)/1.05 Playfair Display,Georgia,serif;letter-spacing:-.045em}
.home-library-heading p{max-width:390px;margin:0;color:#806b65;font-size:14px;line-height:1.7}
.home-library-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
.home-library-card{display:flex;align-items:center;justify-content:space-between;gap:22px;padding:26px 28px;border:1px solid #efd7cf;border-radius:22px;background:#fff;box-shadow:0 12px 28px rgba(67,35,27,.07);color:#3b1f1b;text-decoration:none;transition:transform .18s ease,box-shadow .18s ease}
.home-library-card:hover{transform:translateY(-4px);box-shadow:0 18px 36px rgba(67,35,27,.12)}
.home-library-card .resource-mark{display:grid;place-items:center;flex:0 0 58px;width:58px;height:58px;border-radius:18px;background:#fff0e9;color:#d9553c;font:700 18px Playfair Display,Georgia,serif}
.home-library-card h3{margin:0 0 6px;color:#3b1f1b;font:700 24px/1.15 Playfair Display,Georgia,serif}
.home-library-card p{margin:0;color:#806b65;font-size:14px;line-height:1.55}
.home-library-card .resource-arrow{margin-left:auto;color:#d9553c;font-size:20px}
.community-section{padding-top:52px!important;padding-bottom:52px!important}
.community-grid{gap:42px!important}
.community-card{padding:36px 42px 40px!important;border-radius:22px!important}
.community-card h2{font-size:clamp(31px,4vw,47px)!important}
.community-card p{font-size:14px!important}
.community-sticker{width:56px!important;height:56px!important;top:18px!important;right:20px!important}
.site-footer{margin-top:34px!important}
@media(max-width:850px){.home-library{padding:58px 0 52px}.home-library-heading{display:block}.home-library-heading p{margin-top:14px}.home-library-grid{grid-template-columns:1fr}.community-section{padding-top:38px!important;padding-bottom:38px!important}.community-card{padding:32px 28px 34px!important}}
</style>'''

script = '''<script id="home-library-injection">(function(){function mount(){var root=document.getElementById("root");if(!root||root.querySelector(".home-library"))return;var community=root.querySelector(".community-section");var footer=root.querySelector(".site-footer");if(!community&&!footer)return;var section=document.createElement("section");section.className="section home-library";section.innerHTML='<div class="container"><div class="home-library-heading"><div><p class="eyebrow">Continue explorando</p><h2>Receitas e ideias para sua confeitaria</h2></div><p>Conteúdo simples para testar na cozinha, organizar a produção e tomar decisões melhores no seu negócio.</p></div><div class="home-library-grid"><a class="home-library-card" href="/receitas/"><span class="resource-mark">R</span><span><h3>Receitas</h3><p>Preparo passo a passo, ingredientes organizados e dicas para produzir.</p></span><span class="resource-arrow" aria-hidden="true">→</span></a><a class="home-library-card" href="/ebooks/"><span class="resource-mark">PDF</span><span><h3>E-books</h3><p>Materiais em PDF para estudar, consultar e ampliar seu repertório.</p></span><span class="resource-arrow" aria-hidden="true">→</span></a></div></div>';if(community)community.parentNode.insertBefore(section,community);else footer.parentNode.insertBefore(section,footer)}var root=document.getElementById("root");if(root){var observer=new MutationObserver(mount);observer.observe(root,{childList:true,subtree:true});mount()}})();</script>'''

if 'id="home-tuning"' not in text:
    text = text.replace('</head>', style + '</head>', 1)
if 'id="home-library-injection"' not in text:
    text = text.replace('</body>', script + '</body>', 1)
path.write_text(text, encoding='utf-8')
print('home ajustada: biblioteca de receitas/e-books e comunidade reduzida')

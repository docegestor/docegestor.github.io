from pathlib import Path
import re

path = Path(__file__).resolve().parents[1] / "index.html"
text = path.read_text(encoding="utf-8")
# A home React já possui seu próprio header e footer. Remove apenas a camada HTML que
# havia sido injetada externamente e causava a sensação de três rodapés/duas navegações.
text = re.sub(r'\s*<style id="site-navigation-style">.*?</style></head>', '</head>', text, count=1, flags=re.S)
text = re.sub(r'<div id="site-navigation".*?</div></div><div class="site-resource-strip".*?</div>\s*', '', text, count=1, flags=re.S)
# O footer nativo do app recebe o crédito final com link, sem alterar a estrutura React.
credit = '<script id="site-credit">document.addEventListener("DOMContentLoaded",function(){var b=document.querySelector(".site-footer .footer-bottom");if(b&&!b.querySelector(".developer-credit")){var s=document.createElement("span");s.className="developer-credit";s.innerHTML="Desenvolvido por <a href=\"https://saulomgg.github.io\" target=\"_blank\" rel=\"noopener\">Saulo</a>";b.appendChild(s)}});</script>'
text = text.replace('</body>', credit + '</body>')
path.write_text(text, encoding="utf-8")
print("home shell corrigido")

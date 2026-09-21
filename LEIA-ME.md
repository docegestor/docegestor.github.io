# Correção: cabeçalho, rodapé e favicon do DoceGestor

## O que estava acontecendo (causa raiz)

O menu já é sincronizado automaticamente na maioria das páginas — isso
**não** vem dos seus scripts Python. O problema real estava em outro lugar:

1. **`scripts/publicar_artigo_estatico.py`** e **`scripts/publicar_receitas.py`**
   geravam um cabeçalho *diferente* do cabeçalho real do site (classes CSS
   antigas) e um rodapé genérico, sem o crédito de desenvolvimento. Ou seja:
   toda vez que uma postagem nova fosse publicada, ela nasceria fora do
   padrão visual do resto do site — por isso a sensação de que blog e
   receitas "não fazem parte do site".
2. **Nenhuma página do site tinha favicon** (nem a home).
3. O rodapé era **diferente em cada seção**: `blog/index.html` não tinha
   rodapé nenhum, cada artigo tinha um texto, cada receita tinha outro, e
   `receitas/index.html` tinha um terceiro — e nenhum tinha "Desenvolvido
   por saulomgg".

## O que foi corrigido

- Criei **`scripts/site_layout.py`**: um único lugar com o cabeçalho, o
  rodapé e o favicon "oficiais" do site. Os dois scripts de publicação
  agora importam esse arquivo em vez de montar o HTML na mão. **A lógica
  de geração de conteúdo (JSON, IA, slugs, validações) não foi alterada.**
- O rodapé novo, usado em toda página gerada a partir de agora, é:
  Início / Blog / Receitas / E-books + "© 2026 DoceGestor · Desenvolvido
  por **saulomgg**" (link para https://saulomgg.github.io).
- Rodei um script único (`scripts/patch_existing_pages.py`) para já
  corrigir as páginas que **já estavam publicadas**: favicon + rodapé
  novo em `blog/index.html`, nos 19 artigos, em `receitas/index.html` e
  nas 3 receitas. `index.html`, `404.html` e `ebooks/index.html` só
  ganharam o favicon (não mexi no rodapé deles — o do ebooks tem um link
  de afiliado do PDFGestor que não deveria remover sem você confirmar).

## Como aplicar no seu repositório

1. Substitua a pasta `scripts/` do seu repositório pelos 4 arquivos daqui
   dentro de `scripts/` (mantém os `gerar_*.py`, que eu não toquei).
2. Substitua os arquivos `index.html` de cada pasta de `blog/*/` e
   `receitas/*/` pelos desta entrega, além de `blog/index.html`,
   `receitas/index.html`, `index.html`, `404.html` e `ebooks/index.html`.
3. Commit e push. Da próxima vez que o GitHub Action rodar
   `publicar_artigo_estatico.py` ou `publicar_receitas.py`, o post novo
   já vai sair com o cabeçalho, rodapé e favicon corretos automaticamente.

## Um ponto que encontrei e que você precisa checar

Ao abrir o `.zip` que você me mandou, **10 dos 19 artigos do blog**
(`app-de-precificacao-para-confeitaria`, `como-calcular-preco-de-bolo-para-vender`,
`como-organizar-encomendas-de-doces`, `como-vender-mais-na-confeitaria`,
`controle-de-estoque-de-ingredientes`, `custos-fixos-na-confeitaria`,
`ficha-tecnica-confeitaria-como-montar`, `lucro-na-confeitaria-como-saber`,
`precificar-bolo-de-pote`, `quanto-cobrar-por-brigadeiro-gourmet`,
`rotina-financeira-da-confeiteira`) **não têm nenhum texto do artigo** —
o arquivo é só a casca do app React (`<div id="root"></div>`), sem o
conteúdo estático. Não tem como eu recuperar esse texto porque ele
simplesmente não está no arquivo que você enviou. Vale a pena você
verificar se esses mesmos arquivos, no repositório do GitHub, também
estão vazios assim — se estiverem, esses artigos precisam ser
republicados (rodar `publicar_artigo_estatico.py` de novo a partir dos
dados de origem, se ainda existirem, ou gerar de novo).

Também notei que existe uma pasta `/artigos/` duplicando exatamente o
conteúdo de `/blog/`, sem nenhum link do site apontando pra ela. Não mexi
nela porque não foi pedido, mas pode ser um resto de versão antiga que
vale limpar depois.

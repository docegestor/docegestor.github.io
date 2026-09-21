# Automação única do blog

Todo conteúdo gerado pela IA agora termina no mesmo lugar: `/blog/<slug>/index.html`. A pasta antiga `/artigos/` é apenas legado e não recebe novos conteúdos.

## Fluxo do GitHub Actions

1. O workflow `Gerar e publicar artigo no blog` escolhe a próxima pauta de `data/pautas.json` ou usa o tema informado na execução manual.
2. `scripts/gerar_artigo.py` chama o Gemini usando `GEMINI_API_KEY` e exige um objeto JSON estruturado. A resposta é validada; respostas vazias, truncadas ou com JSON inválido interrompem o job sem commit.
3. `scripts/publicar_artigo_estatico.py` normaliza pequenas variações do JSON, escapa o conteúdo, cria o HTML no padrão editorial do blog, gera SEO/canonical/JSON-LD, navegação e links relacionados.
4. A pasta `blog/<slug>/` é criada, a listagem `blog/index.html` recebe um card HTML permanente e `sitemap.xml` recebe a URL canônica.
5. O Actions faz commit e push somente quando a página e os índices foram realmente alterados.

O catálogo anterior de `data/artigos_automatizados.json` foi sincronizado para `data/artigos_publicados_estaticos.json`, de modo que os posts antigos também aparecem no mesmo bloco de artigos do blog. Nenhuma nova postagem é criada em `artigos/`.

## Secret necessário

No repositório GitHub, mantenha um secret chamado `GEMINI_API_KEY`. O modelo padrão é `gemini-3.6-flash`, podendo ser alterado pela variável `GEMINI_MODEL` no workflow. Se a cota do Gemini estiver excedida, o job falha de forma explícita e não publica uma página incompleta.

## Execução manual

Na aba **Actions**, escolha **Gerar e publicar artigo no blog**. É possível informar `topic` e `category`; deixando `topic` vazio, o workflow usa a próxima pauta com status `pendente`.

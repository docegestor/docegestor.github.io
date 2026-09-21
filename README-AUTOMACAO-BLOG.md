# Blog automático do DoceGestor

O projeto agora usa uma única estrutura para o conteúdo automático: a página de listagem fica em `/blog/` e cada publicação completa fica em `/blog/<slug>/index.html`. As pastas antigas de artigos legados dentro de `/blog/` foram removidas da listagem e não recebem novas publicações.

A página `/blog/` mantém o hero, o header e a identidade visual do DoceGestor, mas exibe somente os artigos publicados pela automação. Os cards mostram categoria, título, resumo, data, tempo de leitura, autoria, imagem de capa e link para a página completa.

## Workflow

O workflow `Gerar e publicar artigo no blog` executa todos os dias às **7h no horário de Brasília**. O GitHub usa UTC, por isso o agendamento é `0 10 * * *`.

A execução manual continua disponível em **Actions → Gerar e publicar artigo no blog → Run workflow**. O campo de categoria oferece cinco opções: **Receitas e produtos**, **Precificação**, **Organização de encomendas**, **Gestão financeira** e **Vendas e marketing**.

## Secrets

Configure `GEMINI_API_KEY` em **Settings → Secrets and variables → Actions**. O workflow prioriza o modelo que já funcionava, `gemini-3.6-flash`, e tenta automaticamente `gemini-3.5-flash-lite` e `gemini-2.5-flash` se houver indisponibilidade temporária, como HTTP 503 ou limite HTTP 429. O fallback `gemini-2.0-flash-lite` foi removido porque o próprio Google informa que esse modelo não está mais disponível e devolve HTTP 404. Cada modelo recebe quatro tentativas com espera progressiva. A capa usa um SVG de fallback local para que a publicação não dependa do Pexels, que está indisponível no momento. Nenhuma chave de API deve ser colocada em arquivos públicos.

## Fluxo de publicação

O Gemini recebe um prompt SEO, escolhe uma das cinco categorias, gera título, slug, meta description, introdução, cinco a sete seções, FAQ, conclusão e CTA. O publicador valida o JSON, normaliza o slug e a categoria, gera a capa fallback, cria o artigo em `/blog/<slug>/`, atualiza `data/artigos_publicados_estaticos.json`, reconstrói a página `/blog/` com o novo artigo em primeiro e atualiza o sitemap.

Cada artigo inclui header padronizado, favicon, categoria, data, tempo de leitura, autoria, imagem com texto alternativo, índice, headings, FAQ, canonical, Open Graph, JSON-LD `BlogPosting`, CTA do DoceGestor e links relacionados.

O site principal, o bundle React original, receitas e e-books permanecem separados. A automação não altera o backend da página inicial.

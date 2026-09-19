# Automação de artigos SEO do DoceGestor

Esta versão parte do site original enviado no arquivo `docegestorsite1.0.zip`. A página inicial, o bundle React, o CSS e os artigos antigos permanecem intactos. A automação apenas cria novas páginas em `artigos/<slug>/`, atualiza o sitemap e injeta novos cards dentro da página de blog existente.

## Horário automático

O workflow executa diariamente às **9h da manhã no horário de Brasília**. O GitHub usa UTC, por isso o cron é:

```yaml
- cron: '0 12 * * *'
```

Também é possível executar manualmente em **Actions → Publicar artigo SEO no blog → Run workflow**.

## Secrets necessários

Configure em **Settings → Secrets and variables → Actions**:

| Secret | Obrigatório | Finalidade |
|---|---:|---|
| `GEMINI_API_KEY` | Sim | Geração do texto SEO |
| `PEXELS_API_KEY` | Recomendado | Busca de uma foto horizontal para a capa |

O código não contém nenhuma chave. Como a chave do Pexels foi colada em uma mensagem, recomenda-se revogá-la e criar outra antes de cadastrá-la no GitHub como `PEXELS_API_KEY`.

Se o Pexels estiver indisponível, o workflow tenta a imagem do Gemini. Se nenhum serviço de imagem responder, cria uma capa SVG de fallback para nunca publicar um artigo sem imagem.

## O que o workflow faz

1. Escolhe a próxima pauta pendente em `data/pautas.json`.
2. Envia ao Gemini um prompt editorial com intenção de busca, palavra-chave, estrutura H2/H3, exemplo prático, erros comuns, checklist, FAQ e CTA.
3. Busca uma foto horizontal no Pexels usando `PEXELS_API_KEY`.
4. Cria `artigos/<slug>/index.html` com o mesmo CSS e o mesmo padrão de cabeçalho, navegação, tipografia e banner de compra dos artigos do site.
5. Atualiza o `sitemap.xml`.
6. Atualiza `data/artigos_automatizados.json`.
7. Insere o card no `.post-grid` do **blog original**, sem modificar o bundle React e sem criar um segundo blog.
8. Faz commit e push somente após todas as etapas concluírem.

## Primeiro teste

Execute primeiro com:

```text
dry_run: true
```

Esse modo somente seleciona a pauta. Depois execute com `dry_run: false` para gerar e publicar o artigo real.

## SEO

Cada artigo inclui título, meta description, canonical, Open Graph, Twitter Card, JSON-LD `BlogPosting`, FAQ estruturado, headings hierárquicos, links internos, imagem com `alt`, CTA para o DoceGestor e inclusão no sitemap.

A automação não promete posição no Google. A indexação depende do rastreamento do Google, da qualidade do conteúdo e da experiência da página.

# Automação de artigos SEO do DoceGestor

A automação publica diariamente um artigo estático no blog do DoceGestor pelo GitHub Actions. O fluxo escolhe a próxima pauta, gera conteúdo estruturado com Gemini, tenta criar uma capa visual relacionada, cria a página dentro de `artigos/<slug>/`, atualiza os cards do blog, atualiza o sitemap e faz commit no repositório.

## Horário automático

O workflow está configurado para executar às **9h da manhã no horário de Brasília**, todos os dias. O GitHub usa UTC, por isso o cron é:

```yaml
- cron: '0 12 * * *'
```

O agendamento do GitHub pode apresentar alguns minutos de atraso. A execução manual continua disponível em **Actions → Publicar artigo SEO no blog → Run workflow**.

## Secrets

Para usar o Gemini, crie em **Settings → Secrets and variables → Actions**:

| Secret | Obrigatório | Finalidade |
|---|---:|---|
| `GEMINI_API_KEY` | Sim | Chave da API do Google AI Studio |
| `GEMINI_MODEL` | Não | Padrão: `gemini-3.6-flash` |
| `GEMINI_FALLBACK_MODEL` | Não | Padrão: `gemini-3.5-flash-lite` |
| `GEMINI_IMAGE_MODEL` | Não | Padrão: `gemini-3.1-flash-image` |

O valor `gen-lang-client-...` é um identificador de projeto, não substitui a API key. A chave deve ser criada no Google AI Studio e nunca deve ser colocada no código ou em arquivo público.

Os secrets de DeepSeek e OpenAI continuam aceitos como fallback opcional, mas não são necessários. Se a OpenAI estiver sem créditos, ela deve ser removida ou deixada apenas como último fallback.

## O que o workflow faz

1. Escolhe a primeira pauta com status `pendente` em `data/pautas.json`.
2. Envia ao Gemini um prompt editorial com intenção de busca, palavra-chave, estrutura H2/H3, leitura mobile, exemplo prático, erros comuns, checklist e perguntas frequentes.
3. Exige título, meta description, introdução, seções, conclusão, FAQ, palavras-chave e prompt de imagem em JSON.
4. Tenta criar uma capa horizontal 16:9 com Gemini e grava a imagem na pasta do artigo. Se o modelo de imagem não estiver disponível para a chave, grava uma capa SVG leve e não interrompe a publicação.
5. Cria `artigos/<slug>/index.html` com o mesmo sistema visual do site, cabeçalho, navegação, tipografia, CTA e links relativos já usados no projeto.
6. Inclui canonical, Open Graph, Twitter Card, JSON-LD `BlogPosting`, data de publicação, imagem, keywords e JSON-LD de FAQ.
7. Atualiza `blog/index.html` dentro do bloco reservado `AUTOMATED_ARTICLES_START/END`, com cards, imagem, categoria, resumo e link para o artigo.
8. Atualiza `data/artigos_automatizados.json`, `data/pautas.json` e `sitemap.xml` com `lastmod` e `changefreq`.
9. Faz commit e push somente depois de todas as etapas terminarem.

## Primeiro teste

Antes de deixar o cron publicar, execute manualmente com `dry_run: true`. Esse modo somente seleciona a pauta e não chama a IA nem altera arquivos. Depois execute com `dry_run: false` para publicar de verdade.

Para escolher uma pauta específica, informe o slug no campo `topic`; caso contrário, o sistema escolhe a próxima pauta pendente.

## Boas práticas de SEO

A automação não promete posição no Google. Ela prepara páginas tecnicamente rastreáveis e editorialmente úteis: conteúdo original, resposta direta à intenção de busca, títulos e descrições coerentes, headings hierárquicos, links internos, FAQ, dados estruturados, imagem com `alt`, canonical, sitemap e boa leitura em celular. O Google ainda pode levar tempo para rastrear e indexar cada URL; a qualidade real do conteúdo e a experiência da página continuam sendo decisivas.

Revise os primeiros artigos publicados. A pauta, a palavra-chave e o texto devem continuar relevantes para o público da confeitaria, sem exageros, conteúdo repetitivo ou afirmações sem fonte.

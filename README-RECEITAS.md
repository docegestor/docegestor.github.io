# Área de receitas do DoceGestor

A área `/receitas/` publica receitas autorais de bolos e doces em páginas HTML estáticas. O header, a faixa de atalhos e o footer são normalizados pelo mesmo shell visual da página inicial.

## Automação diária

O workflow `Gerar e publicar receita doce` executa todos os dias às **18h no horário de Brasília**. O GitHub usa UTC, por isso o agendamento é `0 21 * * *`.

Na execução automática, o script `scripts/gerar_receita.py` usa a mesma `GEMINI_API_KEY` do blog e escolhe a próxima pauta em `data/receitas_pautas.json`. O prompt restringe a produção a bolos e doces e exige conteúdo autoral, sem copiar ou parafrasear receitas de sites, livros ou redes sociais.

Também é possível iniciar manualmente em **Actions → Gerar e publicar receita doce → Run workflow** e informar um tema opcional.

## Proteção contra duplicidade

Antes da publicação, `scripts/publicar_receitas.py` compara a receita nova com receitas publicadas e itens que já estão na fila. A verificação considera slug, título, descrição, ingredientes, preparo e dicas usando normalização de palavras, similaridade de título e sobreposição do conteúdo. Se a receita for muito parecida, o workflow falha sem publicar uma página duplicada.

A mesma verificação foi adicionada ao publicador de artigos. O fluxo de geração do blog, seu prompt e seu horário permanecem inalterados; apenas a barreira de conteúdo semelhante passou a bloquear artigos repetidos antes da publicação.

## Fluxo de publicação

A rotina gera uma receita, coloca o JSON em `data/receitas_pendentes.json`, valida os campos e a categoria `Bolos` ou `Doces`, cria `/receitas/<slug>/index.html`, atualiza `receitas/index.html`, `data/receitas_publicadas.json` e `sitemap.xml`, e salva tudo por commit automático no GitHub.

Cada receita recebe dados estruturados de Recipe, tempos, rendimento, ingredientes, preparo, dicas, header da home, links de navegação, comunidade, footer da home e o crédito clicável “Desenvolvido por saulomgg”.

## Secrets

Configure `GEMINI_API_KEY` em **Settings → Secrets and variables → Actions**. Nenhuma chave deve ser colocada nos arquivos públicos.

## Teste local

```bash
python scripts/gerar_receita.py --topic "bolo de chocolate para vender em fatias"
python scripts/publicar_receitas.py --limit 1
```

A publicação não consulta nem raspa sites externos. As pautas servem apenas como temas editoriais; o texto, ingredientes e preparo são gerados como uma receita autoral.

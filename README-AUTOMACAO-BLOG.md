# Publicação estática de artigos no blog

O blog existente continua em `/blog/`. A publicação automática agora usa uma fila local revisada e não depende de Gemini, Pexels, API externa ou secrets.

## Fluxo

1. Adicione o artigo revisado em `data/artigos_pendentes.json`.
2. O workflow `Publicar artigo estático no blog` executa nos dias úteis às 9h de Brasília.
3. O script cria `blog/<slug>/index.html`, atualiza os cards reservados em `blog/index.html`, registra o artigo em `data/artigos_publicados_estaticos.json` e atualiza `sitemap.xml`.
4. O GitHub Actions faz commit e push somente se houver uma alteração real.

Cada novo artigo fica exclusivamente em `/blog/<slug>/`, que é a rota canônica usada pelos cards, canonical, sitemap e links internos.

A execução manual aceita de zero a três artigos, desde que estejam na fila e tenham sido revisados antes. A antiga automação baseada em IA não é usada neste fluxo.

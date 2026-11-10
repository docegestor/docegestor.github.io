# DoceGestor — site oficial + app

Este repositório publica duas partes do mesmo produto:

- `/` — site oficial, apresentação do DoceGestor, privacidade, apoio, feedback e conteúdo editorial.
- `/app/` — build de produção do aplicativo PWA. O visitante baixa/instala apenas o app nessa rota.
- `/app-source/` — código-fonte React/TypeScript do app, usado para novas versões.

## Publicação no GitHub Pages

O repositório deve publicar a raiz da branch configurada no GitHub Pages. Depois do push, os endereços principais são:

- Site: `https://docegestor.github.io/`
- App: `https://docegestor.github.io/app/`
- Apoio: `https://docegestor.github.io/apoio/`
- Feedback: `https://docegestor.github.io/feedback/`

O app já foi compilado com `base: '/app/'`, portanto seus scripts, ícones, manifest e service worker apontam para a subpasta correta.

## Atualizar o app

```bash
cd app-source
npm install
npm run lint
npm run build
```

O build limpa e recria a pasta `app/` compilada, evitando que arquivos antigos permaneçam no deploy. Em seguida, faça commit dela e do código-fonte alterado.

## Feedback público

Como o GitHub Pages é estático, a página `/feedback/` abre uma issue pública no repositório. Assim, mensagens ficam visíveis e organizadas no GitHub sem colocar tokens ou dados de usuários no navegador.

## Privacidade

O app mantém os dados principais no armazenamento local do aparelho. A sincronização com Google Sheets é opcional e usa a URL de Apps Script configurada pela própria pessoa. O site não possui login nem mecanismo próprio de rastreamento de usuários.

## Redes sociais

O site usa o Instagram público `@saulo_mgg`. Se o perfil mudar, atualize os links em `index.html` e nas páginas de apoio/feedback.

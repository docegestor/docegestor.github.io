# Área de receitas do DoceGestor

A área `/receitas/` é independente do blog existente. O conteúdo do blog continua em `/blog/`, agora com publicação automática de artigos revisados por meio de uma fila local, sem dependência de IA.

As receitas são colocadas manualmente em `data/receitas_pendentes.json`. O workflow `Publicar receitas aprovadas` transforma cada item em uma página HTML estática em `receitas/<slug>/index.html`, atualiza `receitas/index.html`, `data/receitas_publicadas.json` e `sitemap.xml`.

As páginas indicadas pelo usuário podem ser usadas como referência editorial ou como links de origem quando houver autorização. O sistema não raspa nem copia automaticamente receitas completas de terceiros. O `robots.txt` do TudoGostoso bloqueia robôs de IA e a rota de receitas; por isso não é uma fonte apropriada para um copiador automático. No Receiteria, a alternativa segura é consultar a página manualmente, obter autorização quando necessário e inserir uma versão autoral ou licenciada na fila.

## Teste local

```bash
python scripts/publicar_receitas.py --limit 3
```

A publicação automática utiliza somente arquivos locais e não depende de `GEMINI_API_KEY`, `PEXELS_API_KEY` ou qualquer outro segredo.

#!/usr/bin/env python3
"""Gera e publica um artigo SEO estático para o blog DoceGestor.

O fluxo gera texto estruturado com Gemini, tenta criar uma capa com o mesmo
serviço, grava a imagem em artigos/<slug>/, atualiza o blog e o sitemap e
marca a pauta como publicada somente ao final.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://docegestor.github.io"
OPENAI_API_URL = os.getenv("AI_API_URL") or "https://api.openai.com/v1/chat/completions"
OPENAI_MODEL = os.getenv("AI_MODEL") or "gpt-4o-mini"
GEMINI_MODEL = os.getenv("GEMINI_MODEL") or "gemini-3.6-flash"
GEMINI_FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL") or "gemini-3.5-flash-lite"
GEMINI_IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL") or "gemini-3.1-flash-image"
DEEPSEEK_API_URL = os.getenv("DEEPSEEK_API_URL") or "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL") or "deepseek-chat"

PT_MONTHS = ("janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro")


def format_date_pt(value: str) -> str:
    date = dt.date.fromisoformat(value)
    return f"{date.day:02d} de {PT_MONTHS[date.month - 1]} de {date.year}"


def slugify(value: str) -> str:
    value = value.lower().strip()
    replacements = {"á":"a","à":"a","â":"a","ã":"a","ä":"a","é":"e","ê":"e","ë":"e","í":"i","ï":"i","ó":"o","ô":"o","õ":"o","ö":"o","ú":"u","ü":"u","ç":"c"}
    value = "".join(replacements.get(c, c) for c in value)
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")[:80].rstrip("-")


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def existing_articles() -> list[dict[str, str]]:
    result = []
    for path in sorted((ROOT / "artigos").glob("*/index.html")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        title = re.search(r"<title>(.*?)</title>", text, re.I | re.S)
        desc = re.search(r'<meta name="description" content="(.*?)"', text, re.I | re.S)
        result.append({"slug": path.parent.name, "title": html.unescape(title.group(1).strip()) if title else path.parent.name, "description": html.unescape(desc.group(1).strip()) if desc else ""})
    return result


def choose_topic(topics: list[dict[str, Any]], existing: list[dict[str, str]], requested: str | None) -> dict[str, Any]:
    used = {x["slug"] for x in existing}
    pending = [x for x in topics if x.get("status", "pendente") == "pendente"]
    if requested:
        matches = [x for x in topics if x.get("slug") == requested or slugify(x.get("titulo", "")) == requested]
        if not matches:
            raise RuntimeError(f"Pauta não encontrada: {requested}")
        topic = matches[0]
        if topic.get("status") == "publicada" or slugify(topic["titulo"]) in used:
            raise RuntimeError("A pauta solicitada já foi publicada ou tem slug em uso.")
        return topic
    for topic in pending:
        if slugify(topic["titulo"]) not in used:
            return topic
    raise RuntimeError("Não há pautas pendentes disponíveis.")


def validate_article(article: dict[str, Any]) -> None:
    required = ["title", "meta_description", "intro", "sections", "conclusion", "image_prompt"]
    if not all(article.get(k) for k in required):
        raise RuntimeError("Artigo incompleto: faltam campos obrigatórios.")
    if not isinstance(article["sections"], list) or len(article["sections"]) < 5:
        raise RuntimeError("Artigo inválido: são necessárias pelo menos 5 seções.")
    if len(article["title"]) > 65:
        raise RuntimeError("Título excede 65 caracteres.")
    if not 120 <= len(article["meta_description"]) <= 170:
        raise RuntimeError("Meta description deve ter entre 120 e 170 caracteres.")
    if not isinstance(article.get("faq", []), list):
        raise RuntimeError("FAQ inválido.")


def parse_ai_content(content: str) -> dict[str, Any]:
    content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip(), flags=re.I)
    try:
        article = json.loads(content)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"A IA não retornou JSON válido: {exc}") from exc
    validate_article(article)
    return article


def call_openai_compatible(url: str, key: str, model: str, system: str, user: str) -> dict[str, Any]:
    payload = json.dumps({"model": model, "temperature": 0.65, "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}).encode()
    request = urllib.request.Request(url, data=payload, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(request, timeout=120) as response:
        data = json.loads(response.read().decode())
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("Resposta compatível não contém choices[0].message.content.") from exc
    return parse_ai_content(content)


def call_gemini(key: str, model: str, system: str, user: str) -> dict[str, Any]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    payload = json.dumps({"system_instruction": {"parts": [{"text": system}]}, "contents": [{"role": "user", "parts": [{"text": user}]}], "generationConfig": {"temperature": 0.65, "responseMimeType": "application/json"}}).encode()
    for attempt in range(3):
        request = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                data = json.loads(response.read().decode())
            break
        except urllib.error.HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
            wait = 2 ** attempt
            print(f"Gemini {model} indisponível (HTTP {exc.code}); nova tentativa em {wait}s.", file=sys.stderr)
            time.sleep(wait)
    try:
        content = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("Resposta Gemini não contém texto JSON.") from exc
    return parse_ai_content(content)


def call_gemini_image(key: str, model: str, prompt: str, output: Path) -> bool:
    """Tenta criar uma capa com Gemini; retorna False sem interromper a publicação."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["IMAGE", "TEXT"], "imageConfig": {"aspectRatio": "16:9"}}}).encode()
    try:
        request = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(request, timeout=180) as response:
            data = json.loads(response.read().decode())
        for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                mime = inline.get("mimeType", "image/png")
                extension = ".jpg" if "jpeg" in mime else ".png"
                output = output.with_suffix(extension)
                output.write_bytes(base64.b64decode(inline["data"]))
                return True
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, KeyError, IndexError, TypeError) as exc:
        print(f"Capa Gemini indisponível; usando capa SVG: {exc}", file=sys.stderr)
    return False


def call_pexels_image(api_key: str, query: str, output: Path) -> bool:
    """Baixa uma foto horizontal do Pexels para a capa do artigo."""
    params = urllib.parse.urlencode({"query": query[:80], "orientation": "landscape", "size": "large", "per_page": 1})
    request = urllib.request.Request(f"https://api.pexels.com/v1/search?{params}", headers={"Authorization": api_key})
    try:
        with urllib.request.urlopen(request, timeout=40) as response:
            data = json.loads(response.read().decode())
        source = (data.get("photos") or [{}])[0].get("src", {})
        image_url = source.get("large2x") or source.get("large") or source.get("original")
        if not image_url:
            return False
        with urllib.request.urlopen(image_url, timeout=60) as response:
            output.write_bytes(response.read())
        return output.stat().st_size > 1000
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, KeyError, IndexError, TypeError) as exc:
        print(f"Imagem Pexels indisponível; usando capa SVG: {exc}", file=sys.stderr)
        return False


def write_fallback_cover(path: Path, title: str, category: str) -> None:
    """Capa vetorial leve para garantir que toda página tenha imagem social/hero."""
    safe_title = html.escape(title[:72])
    safe_category = html.escape(category[:34])
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-labelledby="title desc"><title id="title">{safe_title}</title><desc id="desc">{safe_category} — DoceGestor</desc><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff7f3"/><stop offset="1" stop-color="#ffd6c8"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="1310" cy="180" r="210" fill="#f4775b" opacity=".18"/><circle cx="1450" cy="700" r="310" fill="#e65f47" opacity=".12"/><path d="M1120 650c80-180 180-270 300-270s220 90 300 270" fill="none" stroke="#e65f47" stroke-width="28" stroke-linecap="round"/><text x="110" y="180" font-family="Georgia,serif" font-size="42" fill="#e65f47">{safe_category}</text><text x="110" y="330" font-family="Georgia,serif" font-weight="700" font-size="74" fill="#3b1f1b">DoceGestor</text><text x="110" y="445" font-family="Arial,sans-serif" font-size="38" fill="#5b3a35">{safe_title}</text><text x="110" y="780" font-family="Arial,sans-serif" font-size="28" fill="#5b3a35">Gestão simples para confeiteiras</text></svg>'''
    path.write_text(svg, encoding="utf-8")


def call_ai(topic: dict[str, Any], related: list[dict[str, str]]) -> dict[str, Any]:
    related_text = "\n".join(f'- {x["title"]}: {BASE_URL}/artigos/{x["slug"]}/' for x in related[:8]) or "Nenhum artigo relacionado disponível."
    system = "Você é uma especialista em SEO editorial, conteúdo útil e experiência de leitura para pequenas confeiteiras brasileiras. Escreva em português do Brasil natural, sem inventar estatísticas, fontes, preços ou promessas. O conteúdo deve demonstrar experiência prática, responder à intenção de busca e ser realmente útil."
    user = f'''Crie um artigo completo e original para o blog DoceGestor.
Pauta: {topic["titulo"]}
Palavra-chave principal: {topic.get("keyword", "")}
Categoria: {topic.get("categoria", "Gestão de confeitaria")}

Responda SOMENTE com JSON válido neste formato:
{{"title":"...","meta_description":"...","intro":"...","sections":[{{"heading":"...","subsections":[{{"heading":"...","paragraphs":["..."],"bullets":["..."]}}]}}],"conclusion":"...","faq":[{{"question":"...","answer":"..."}}],"image_prompt":"...","keywords":["..."]}}

Regras editoriais e SEO:
- title claro, atraente e com a palavra-chave quando couber, até 65 caracteres;
- meta_description entre 120 e 170 caracteres, com benefício e palavra-chave sem parecer artificial;
- introdução de 2 a 3 parágrafos curtos respondendo logo à intenção da busca;
- 5 a 7 seções H2, com H3 apenas quando realmente ajudar;
- inclua passos práticos, exemplo numérico simples quando fizer sentido, erros comuns e uma checklist;
- use a palavra-chave e variações sem keyword stuffing;
- escreva para leitura fácil no celular, com parágrafos curtos e listas úteis;
- não invente dados, estudos, leis, resultados ou links externos;
- inclua 3 a 5 perguntas frequentes com respostas objetivas;
- termine com conclusão útil e CTA natural para conhecer o DoceGestor, sem promessa exagerada;
- image_prompt deve descrever uma foto editorial horizontal 16:9, sem texto, sem logotipos e sem marcas d'água, relacionada ao assunto e adequada para capa de blog;
- keywords deve conter de 5 a 8 termos relacionados.

Artigos existentes para links internos (use somente estes slugs):
{related_text}'''
    providers = []
    if os.getenv("GEMINI_API_KEY"):
        key = os.environ["GEMINI_API_KEY"]
        providers.append((f"Gemini ({GEMINI_MODEL})", lambda: call_gemini(key, GEMINI_MODEL, system, user)))
        if GEMINI_FALLBACK_MODEL and GEMINI_FALLBACK_MODEL != GEMINI_MODEL:
            providers.append((f"Gemini fallback ({GEMINI_FALLBACK_MODEL})", lambda: call_gemini(key, GEMINI_FALLBACK_MODEL, system, user)))
    if os.getenv("DEEPSEEK_API_KEY"):
        providers.append(("DeepSeek", lambda: call_openai_compatible(DEEPSEEK_API_URL, os.environ["DEEPSEEK_API_KEY"], DEEPSEEK_MODEL, system, user)))
    if os.getenv("AI_API_KEY"):
        providers.append(("OpenAI", lambda: call_openai_compatible(OPENAI_API_URL, os.environ["AI_API_KEY"], OPENAI_MODEL, system, user)))
    if not providers:
        raise RuntimeError("Nenhum provedor configurado. Adicione GEMINI_API_KEY.")
    errors = []
    for name, provider in providers:
        try:
            print(f"Tentando provedor: {name}")
            return provider()
        except (urllib.error.HTTPError, urllib.error.URLError, RuntimeError) as exc:
            detail = str(exc)
            if isinstance(exc, urllib.error.HTTPError):
                detail = f"HTTP {exc.code}: {exc.read().decode(errors='replace')[:400]}"
            errors.append(f"{name}: {detail}")
            print(f"Provedor indisponível: {name} — tentando o próximo.", file=sys.stderr)
    raise RuntimeError("Todos os provedores falharam: " + " | ".join(errors))


def esc(value: str) -> str:
    return html.escape(str(value or ""), quote=True)


def rich_text(value: str) -> str:
    """Renderiza texto da IA com links Markdown seguros, sem deixar Markdown cru."""
    escaped = esc(value)
    pattern = r'\[([^\]]+)\]\((https?://[^)\s]+|/[^)\s]+)\)'
    links: list[str] = []
    def markdown_link(match: re.Match[str]) -> str:
        links.append(f'<a href="{esc(match.group(2))}">{match.group(1)}</a>')
        return f'__DOCE_LINK_{len(links)-1}__'
    rendered = re.sub(pattern, markdown_link, escaped)
    rendered = re.sub(r'(?<![A-Za-z0-9_])(https?://[^\s<]+)', lambda match: f'<a href="{match.group(1).rstrip(".,)")}">{match.group(1).rstrip(".,)")}</a>', rendered)
    for index, link in enumerate(links):
        rendered = rendered.replace(f'__DOCE_LINK_{index}__', link)
    return rendered


def render_section(section: dict[str, Any]) -> str:
    chunks = [f'<section class="article-section"><h2>{esc(section.get("heading"))}</h2>']
    for sub in section.get("subsections", []):
        if sub.get("heading"):
            chunks.append(f'<h3>{esc(sub.get("heading"))}</h3>')
        for paragraph in sub.get("paragraphs", []):
            chunks.append(f'<p>{rich_text(paragraph)}</p>')
        bullets = sub.get("bullets", [])
        if bullets:
            chunks.append('<ul>' + ''.join(f'<li>{rich_text(item)}</li>' for item in bullets) + '</ul>')
    chunks.append('</section>')
    return ''.join(chunks)


def render_faq(faq: list[dict[str, str]]) -> tuple[str, list[dict[str, Any]]]:
    if not faq:
        return "", []
    chunks = ['<section class="article-section faq-section"><h2>Perguntas frequentes</h2>']
    schema = []
    for item in faq[:5]:
        question, answer = item.get("question", ""), item.get("answer", "")
        if question and answer:
            chunks.append(f'<h3>{esc(question)}</h3><p>{rich_text(answer)}</p>')
            schema.append({"@type": "Question", "name": question, "acceptedAnswer": {"@type": "Answer", "text": answer}})
    chunks.append('</section>')
    return ''.join(chunks), schema


def render_html(article: dict[str, Any], topic: dict[str, Any], slug: str, related: list[dict[str, str]], image_url: str, published: str) -> str:
    title, description = article["title"], article["meta_description"]
    canonical = f"{BASE_URL}/artigos/{slug}/"
    related_html = ''.join(f'<li><a href="/artigos/{esc(x["slug"])}/">{esc(x["title"])}</a></li>' for x in related[:4])
    sections = ''.join(render_section(s) for s in article["sections"])
    faq_html, faq_schema = render_faq(article.get("faq", []))
    keywords = article.get("keywords", [])
    schema = {"@context": "https://schema.org", "@type": "BlogPosting", "headline": title, "description": description, "image": [image_url], "datePublished": published, "dateModified": published, "author": {"@type": "Organization", "name": "Equipe DoceGestor"}, "publisher": {"@type": "Organization", "name": "DoceGestor"}, "articleSection": topic.get("categoria", "Gestão de confeitaria"), "keywords": keywords, "mainEntityOfPage": {"@type": "WebPage", "@id": canonical}}
    if faq_schema:
        schema["subjectOf"] = {"@type": "FAQPage", "mainEntity": faq_schema}
    return f'''<!doctype html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#f4775b"><meta name="robots" content="index, follow"><meta name="author" content="DoceGestor">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
<title>{esc(title)} | DoceGestor</title><meta name="description" content="{esc(description)}"><meta name="keywords" content="{esc(', '.join(keywords))}"><link rel="canonical" href="{canonical}">
<meta property="og:type" content="article"><meta property="og:title" content="{esc(title)} | DoceGestor"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{image_url}"><meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(title)} | DoceGestor"><meta name="twitter:description" content="{esc(description)}"><meta name="twitter:image" content="{image_url}">
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
<link rel="stylesheet" href="/assets/index-D6y4RxRJ.css"></head><body style="background:#fffaf8;color:#3b1f1b">
<div style="background:#fff7f3;border-bottom:1px solid #f6ddd5"><div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-sm"><strong style="color:#3b1f1b">Doce &amp; Lucro</strong><a href="https://t.me/docelucro" style="color:#e65f47">Entrar na comunidade →</a></div></div>
<header class="mx-auto flex max-w-6xl items-center justify-between px-4 py-5"><a href="/" class="font-bold">DG Doce Gestor</a><nav class="flex gap-4 text-sm"><a href="/">O app</a><a href="/#recursos">Recursos</a><a href="/#como-funciona">Como funciona</a><a href="/blog/">Blog</a><a href="https://www.mercadolivre.com.br/docegestor-sistema-para-confeitaria--precificacao-e-vendas/up/MLBU4686356819?pdp_filters=item_id:MLB7401439782">Comprar agora</a></nav></header>
<main class="mx-auto max-w-3xl px-4 pb-16 pt-8"><div class="mb-6 text-sm opacity-70"><a href="/blog/">Voltar para o blog</a></div>
<article><p class="mb-3 text-sm font-semibold uppercase tracking-wider" style="color:#f4775b">{esc(topic.get("categoria", "Gestão de confeitaria"))}</p><h1 class="mb-6 font-serif text-4xl font-bold leading-tight md:text-5xl">{esc(title)}</h1><p class="mb-4 text-xl opacity-80">{rich_text(article["intro"])}</p><p style="font-size:14px;opacity:.7;margin-bottom:30px">{format_date_pt(published)} · 7 min de leitura · Por Equipe DoceGestor</p>
<figure style="margin:0 0 32px"><img src="{image_url}" alt="Ilustração relacionada a {esc(title)}" width="1600" height="900" loading="eager" fetchpriority="high" style="display:block;width:100%;height:auto;border-radius:24px;box-shadow:0 16px 40px rgba(59,31,27,.12)"><figcaption style="margin-top:8px;font-size:13px;opacity:.65">Conteúdo educativo para gestão de confeitaria.</figcaption></figure>
<div style="background:#fff7f3;border:1px solid #f3c5b8;border-radius:16px;padding:18px 22px;margin:0 0 30px"><strong>Índice deste artigo</strong><ul style="margin:10px 0 0">{''.join(f'<li><a href="#sec-{i}">{esc(s.get("heading"))}</a></li>' for i, s in enumerate(article["sections"]))}</ul></div>
<div class="space-y-6 text-base leading-8">{''.join(s.replace('<section class="article-section">', f'<section id="sec-{i}" class="article-section">', 1) for i, s in enumerate([render_section(s) for s in article["sections"]]))}{faq_html}<section class="article-section"><h2>Conclusão</h2><p>{rich_text(article["conclusion"])}</p></section>
<section class="rounded-2xl p-6" style="background:#fff1ed"><h2>Do papel para o celular</h2><p><strong>Precifique com mais segurança no DoceGestor.</strong></p><p>Pagamento único, acesso vitalício e uso online ou offline para calcular custos, registrar vendas e acompanhar o lucro.</p><p><a class="font-bold" style="color:#e65f47" href="https://www.mercadolivre.com.br/docegestor-sistema-para-confeitaria--precificacao-e-vendas/up/MLBU4686356819?pdp_filters=item_id:MLB7401439782">Conhecer o app →</a></p></section>
<section><h2>Leia também</h2><ul>{related_html}</ul></section></div></article></main>
<footer class="border-t px-4 py-8 text-center text-sm opacity-70"><a href="/">DoceGestor</a> · Gestão para confeitarias</footer></body></html>'''


def update_sitemap(slug: str, published: str) -> None:
    path = ROOT / "sitemap.xml"
    text = path.read_text(encoding="utf-8")
    url = f"{BASE_URL}/artigos/{slug}/"
    if url in text:
        text = re.sub(rf'\s*<url><loc>{re.escape(url)}</loc>.*?</url>', f'\n  <url><loc>{url}</loc><lastmod>{published}</lastmod><priority>0.8</priority><changefreq>monthly</changefreq></url>', text, flags=re.S)
    else:
        entry = f"  <url><loc>{url}</loc><lastmod>{published}</lastmod><priority>0.8</priority><changefreq>monthly</changefreq></url>\n"
        if "</urlset>" not in text:
            raise RuntimeError("sitemap.xml não tem fechamento </urlset>.")
        text = text.replace("</urlset>", entry + "</urlset>")
    path.write_text(text, encoding="utf-8")


def update_blog_index(article: dict[str, Any], topic: dict[str, Any], slug: str, image_url: str, published: str) -> None:
    """Atualiza a lista do /blog/ sem alterar o bundle React principal do site."""
    registry_path = ROOT / "data" / "artigos_automatizados.json"
    registry = load_json(registry_path, [])
    item = {
        "slug": slug,
        "title": article["title"],
        "description": article["meta_description"],
        "category": topic.get("categoria", "Gestão"),
        "image": image_url,
        "published": published,
    }
    registry = [x for x in registry if x.get("slug") != slug]
    registry.insert(0, item)
    registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    path = ROOT / "blog" / "index.html"
    text = path.read_text(encoding="utf-8")
    start_marker, end_marker = "<!-- AUTOMATED_ARTICLES_START -->", "<!-- AUTOMATED_ARTICLES_END -->"
    if start_marker not in text or end_marker not in text:
        raise RuntimeError("blog/index.html não contém o bloco reservado para artigos automatizados.")

    cards = "".join(
        f'<a href="/artigos/{esc(x["slug"])}/" style="display:block;overflow:hidden;border:1px solid #f3c5b8;border-radius:18px;background:#fffaf8;text-decoration:none;color:#3b1f1b;box-shadow:0 8px 22px rgba(59,31,27,.06)"><img src="{esc(x.get("image", ""))}" alt="{esc(x.get("title", ""))}" width="800" height="450" loading="lazy" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover"><div style="padding:18px 20px"><small style="color:#e65f47;font-weight:700;text-transform:uppercase">{esc(x.get("category", "Gestão"))}</small><strong style="display:block;margin-top:6px;font-size:18px">{esc(x["title"])}</strong><span style="display:block;margin-top:8px;opacity:.75;line-height:1.5">{esc(x["description"])}</span><span style="display:block;margin-top:12px;color:#e65f47;font-weight:700">Ler artigo →</span></div></a>'
        for x in registry[:12]
    )
    block = f"""{start_marker}
    <section id="automated-articles" style="display:none;max-width:1152px;margin:40px auto;padding:0 24px 60px;font-family:DM Sans,sans-serif">
      <h2 style="font-family:Playfair Display,serif;font-size:32px;color:#3b1f1b">Novos artigos do DoceGestor</h2>
      <div id="automated-articles-list" style="display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">{cards}</div>
    </section>
    {end_marker}"""
    text = text.split(start_marker, 1)[0] + block + text.split(end_marker, 1)[1]

    payload = json.dumps(registry[:12], ensure_ascii=False, separators=(",", ":"))
    sync_script = """<script id="automated-blog-sync">(function(){
      const items=__PAYLOAD__;
      function escape(value){return String(value ?? "").replace(/[&<>"']/g,function(char){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[char]});}
      function add(){
        const grid=document.querySelector('.post-grid');
        const fallback=document.getElementById('automated-articles');
        if(!grid){if(fallback)fallback.style.display='block';return;}
        if(fallback)fallback.style.display='none';
        items.slice().reverse().forEach(function(item){
          if(grid.querySelector('[data-auto-slug="'+CSS.escape(item.slug)+'"]'))return;
          const card=document.createElement('article');card.className='post-card';card.dataset.autoSlug=item.slug;
          const href='/artigos/'+encodeURIComponent(item.slug)+'/';
          card.innerHTML='<a class="post-image" href="'+href+'" aria-label="'+escape(item.title)+'"><img src="'+escape(item.image)+'" alt="'+escape(item.title)+'" loading="lazy"></a><div class="post-body"><div class="post-meta">'+escape(item.category)+' · '+escape(item.published.split('-').reverse().join('/'))+'</div><h2><a href="'+href+'">'+escape(item.title)+'</a></h2><p>'+escape(item.description)+'</p><a class="read-link" href="'+href+'">Ler artigo →</a></div>';
          grid.insertBefore(card,grid.firstChild);
        });
      }
      setTimeout(add,300);setTimeout(add,1200);new MutationObserver(add).observe(document.body,{childList:true,subtree:true});
    })();</script>""".replace('__PAYLOAD__', payload)
    text = re.sub(r'<script id="automated-blog-sync">.*?</script>', '', text, flags=re.S)
    text = text.replace('</body>', sync_script + '</body>')
    path.write_text(text, encoding="utf-8")



def sync_react_blog_bundle(article: dict[str, Any], topic: dict[str, Any], slug: str, image_url: str, published: str) -> None:
    """Compatibilidade: o bundle global nunca é alterado pela automação."""
    return


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--topic")
    args = parser.parse_args()
    topics_path = ROOT / "data" / "pautas.json"
    topics = load_json(topics_path, [])
    existing = existing_articles()
    topic = choose_topic(topics, existing, args.topic)
    slug = slugify(topic["titulo"])
    if args.dry_run:
        print(json.dumps({"mode": "dry-run", "topic": topic, "slug": slug, "existing_articles": len(existing)}, ensure_ascii=False, indent=2))
        return 0
    article = call_ai(topic, existing)
    published = dt.date.today().isoformat()
    out_dir = ROOT / "artigos" / slug
    if out_dir.exists():
        raise RuntimeError(f"Pasta já existe; nada foi sobrescrito: {out_dir}")
    out_dir.mkdir(parents=True)
    image_path = out_dir / "capa.jpg"
    pexels_query = f'{topic.get("keyword", topic["titulo"])} confeitaria doces'
    image_ok = bool(os.getenv("PEXELS_API_KEY") and call_pexels_image(os.environ["PEXELS_API_KEY"], pexels_query, image_path))
    if not image_ok and os.getenv("GEMINI_API_KEY"):
        image_path = out_dir / "capa.png"
        image_ok = call_gemini_image(os.environ["GEMINI_API_KEY"], GEMINI_IMAGE_MODEL, article["image_prompt"], image_path)
    if not image_ok:
        image_path = out_dir / "capa.svg"
        write_fallback_cover(image_path, article["title"], topic.get("categoria", "Gestão"))
    image_url = f"{BASE_URL}/artigos/{slug}/{image_path.name}"
    out = out_dir / "index.html"
    out.write_text(render_html(article, topic, slug, existing, image_url, published), encoding="utf-8")
    update_sitemap(slug, published)
    update_blog_index(article, topic, slug, image_url, published)
    sync_react_blog_bundle(article, topic, slug, image_url, published)
    topic["status"] = "publicada"
    topic["slug_publicado"] = slug
    topic["publicada_em"] = published
    topics_path.write_text(json.dumps(topics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Artigo criado: {out}")
    print(f"Capa criada: {image_path}")
    print(f"URL: {BASE_URL}/artigos/{slug}/")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        raise SystemExit(1)

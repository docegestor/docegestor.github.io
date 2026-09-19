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


def write_fallback_cover(path: Path, title: str, category: str) -> None:
    """Capa vetorial leve para garantir que toda página tenha imagem social/hero."""
    safe_title = html.escape(title[:72])
    safe_category = html.escape(category[:34])
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-labelledby="title desc"><title id="title">{safe_title}</title><desc id="desc">{safe_category} — DoceGestor</desc><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff7f3"/><stop offset="1" stop-color="#ffd6c8"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="1310" cy="180" r="210" fill="#f4775b" opacity=".18"/><circle cx="1450" cy="700" r="310" fill="#e65f47" opacity=".12"/><path d="M1120 650c80-180 180-270 300-270s220 90 300 270" fill="none" stroke="#e65f47" stroke-width="28" stroke-linecap="round"/><text x="110" y="180" font-family="Georgia,serif" font-size="42" fill="#e65f47">{safe_category}</text><text x="110" y="330" font-family="Georgia,serif" font-weight="700" font-size="74" fill="#3b1f1b">DoceGestor</text><text x="110" y="445" font-family="Arial,sans-serif" font-size="38" fill="#5b3a35">{safe_title}</text><text x="110" y="780" font-family="Arial,sans-serif" font-size="28" fill="#5b3a35">Gestão simples para confeiteiras</text></svg>'''
    path.write_text(svg, encoding="utf-8")


def call_ai(topic: dict[str, Any], related: list[dict[str, str]]) -> dict[str, Any]:
    related_text = "\n".join(f'- {x["title"]}: {BASE_URL}/artigos/{x["slug"]}/' for x in related[:8]) or "Nenhum artigo relacionado disponível."
    system = (
        "Você é uma redatora sênior especialista em SEO editorial e em confeitaria/gestão financeira para pequenos negócios "
        "no Brasil. Você escreveu para veículos como blogs de referência do setor. Escreve em português do Brasil natural, "
        "com autoridade e exemplos concretos, nunca em tom robótico ou genérico de IA. Nunca inventa estatísticas, estudos, "
        "leis, preços de mercado ou fontes externas — quando precisar de um número de exemplo, deixa claro que é ilustrativo. "
        "Cada artigo deve parecer escrito por alguém que realmente entende do dia a dia de uma confeitaria."
    )
    user = f'''Crie um artigo completo, original e aprofundado para o blog DoceGestor — o padrão de qualidade é o de um guia definitivo sobre o tema, não um texto raso de preenchimento.
Pauta: {topic["titulo"]}
Palavra-chave principal: {topic.get("keyword", "")}
Categoria: {topic.get("categoria", "Gestão de confeitaria")}

Responda SOMENTE com JSON válido neste formato:
{{"title":"...","meta_description":"...","intro":"...","sections":[{{"heading":"...","subsections":[{{"heading":"...","paragraphs":["..."],"bullets":["..."]}}]}}],"conclusion":"...","faq":[{{"question":"...","answer":"..."}}],"image_prompt":"...","keywords":["..."]}}

Regras editoriais e SEO (siga todas):
- title claro, específico e com a palavra-chave principal o mais próximo possível do início, até 65 caracteres;
- meta_description entre 120 e 170 caracteres, com benefício claro e a palavra-chave, escrita para gerar cliques, sem soar genérica;
- introdução de 2 a 3 parágrafos curtos que já respondem à intenção de busca na primeira frase e mencionam a palavra-chave principal;
- 5 a 7 seções H2 substanciais (não títulos vagos), com H3 quando ajudar a organizar; cada seção deve ter pelo menos 2 parágrafos ou uma lista com contexto — nada de seções de uma linha só;
- artigo deve ter profundidade de um guia real: inclua passos práticos numerados quando fizer sentido, um exemplo numérico simples e completo, erros comuns do dia a dia e uma checklist acionável;
- use a palavra-chave principal e variações naturais (sinônimos, termos relacionados) ao longo do texto, sem repetição forçada (sem keyword stuffing);
- escreva frases curtas e parágrafos de 2 a 4 linhas, pensando em leitura no celular; use listas para tornar informação densa mais fácil de escanear;
- não invente dados, estudos, leis, resultados de terceiros ou links externos; se citar um valor, deixe claro que é um exemplo;
- inclua de 3 a 5 perguntas frequentes reais (as que uma confeiteira pesquisaria no Google), com respostas objetivas de 1 a 3 frases;
- a conclusão deve resumir o principal insight do artigo antes de convidar a pessoa a conhecer o DoceGestor — CTA natural, sem promessa exagerada nem linguagem de propaganda;
- image_prompt deve descrever uma foto editorial horizontal 16:9, fotorrealista, sem texto, sem logotipos, sem marcas d'água, relacionada ao assunto e com boa composição para capa de blog;
- keywords deve conter de 5 a 8 termos relacionados (long-tail incluído).

Artigos existentes para links internos (use somente estes slugs, e cite pelo menos 2 no corpo do texto quando fizer sentido):
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


def render_section(section: dict[str, Any]) -> str:
    chunks = [f'<section class="article-section"><h2>{esc(section.get("heading"))}</h2>']
    for sub in section.get("subsections", []):
        if sub.get("heading"):
            chunks.append(f'<h3>{esc(sub.get("heading"))}</h3>')
        for paragraph in sub.get("paragraphs", []):
            chunks.append(f'<p>{esc(paragraph)}</p>')
        bullets = sub.get("bullets", [])
        if bullets:
            chunks.append('<ul>' + ''.join(f'<li>{esc(item)}</li>' for item in bullets) + '</ul>')
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
            chunks.append(f'<h3>{esc(question)}</h3><p>{esc(answer)}</p>')
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
    # NOTA IMPORTANTE: este template usa um <style> próprio e autocontido em vez de
    # classes utilitárias do Tailwind (ex.: font-serif, max-w-3xl, rounded-2xl...).
    # O CSS compilado do site (/assets/index-*.css) só contém as classes que o Tailwind
    # encontrou dentro do código-fonte React em tempo de build — como este script gera
    # HTML fora desse build, classes "pedidas" aqui que não existem lá saem sem estilo
    # nenhum. Escrever o CSS aqui garante que o artigo sempre saia com a cara certa,
    # e também deixa de depender de um nome de arquivo com hash que pode mudar (ou
    # sumir) no próximo rebuild do site.
    style = '''
    :root{--brand:#f4775b;--accent:#e65f47;--ink:#3b1f1b;--ink-soft:#5b3a35;--bg:#fffaf8;--card:#fff1ed;--border:#f3c5b8}
    *{box-sizing:border-box}
    body{margin:0;background:var(--bg);color:var(--ink);font-family:'DM Sans',Arial,sans-serif;font-size:17px;line-height:1.7}
    a{color:var(--accent)}
    header.site-header{max-width:1152px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:20px 24px}
    header.site-header .logo{font-weight:700;font-size:18px;color:var(--ink);text-decoration:none}
    header.site-header nav{display:flex;gap:20px;font-size:14px}
    header.site-header nav a{text-decoration:none;color:var(--ink)}
    main{max-width:760px;margin:0 auto;padding:8px 24px 64px}
    .breadcrumb{font-size:13px;opacity:.7;margin-bottom:24px}
    .eyebrow{display:block;margin-bottom:10px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--brand)}
    h1{font-family:'Playfair Display',Georgia,serif;font-weight:800;font-size:38px;line-height:1.2;margin:0 0 22px}
    .lede{font-size:20px;line-height:1.6;opacity:.85;margin:0 0 30px}
    figure{margin:0 0 32px}
    figure img{display:block;width:100%;height:auto;border-radius:20px;box-shadow:0 16px 40px rgba(59,31,27,.12)}
    figcaption{margin-top:8px;font-size:13px;opacity:.65}
    article h2{font-family:'Playfair Display',Georgia,serif;font-size:26px;font-weight:700;margin:34px 0 14px;color:var(--ink)}
    article h3{font-size:19px;font-weight:700;margin:22px 0 10px;color:var(--ink)}
    article p{margin:0 0 16px}
    article ul{margin:0 0 16px;padding-left:22px}
    article li{margin-bottom:8px}
    .cta-banner{margin:44px 0;padding:32px;border-radius:22px;background:linear-gradient(135deg,var(--brand),var(--accent));color:#fff;text-align:center}
    .cta-banner h2{color:#fff;margin-top:0}
    .cta-banner p{color:#fff;opacity:.95;max-width:520px;margin:0 auto 20px}
    .cta-banner .btn{display:inline-block;background:#fff;color:var(--accent);font-weight:700;text-decoration:none;padding:14px 30px;border-radius:999px;font-size:16px}
    .related{margin-top:40px}
    .related h2{font-family:'Playfair Display',Georgia,serif;font-size:22px}
    .related ul{padding-left:22px}
    footer.site-footer{border-top:1px solid var(--border);padding:32px 24px;text-align:center;font-size:14px;opacity:.7}
    footer.site-footer a{color:var(--ink);font-weight:700;text-decoration:none}
    @media(min-width:640px){h1{font-size:46px}}
    '''
    return f'''<!doctype html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#f4775b"><meta name="robots" content="index, follow"><meta name="author" content="DoceGestor">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
<title>{esc(title)} | DoceGestor</title><meta name="description" content="{esc(description)}"><meta name="keywords" content="{esc(', '.join(keywords))}"><link rel="canonical" href="{canonical}">
<meta property="og:type" content="article"><meta property="og:title" content="{esc(title)} | DoceGestor"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{image_url}"><meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(title)} | DoceGestor"><meta name="twitter:description" content="{esc(description)}"><meta name="twitter:image" content="{image_url}">
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
<style>{style}</style></head><body>
<header class="site-header"><a href="/" class="logo">DoceGestor</a><nav><a href="/">O app</a><a href="/blog/">Blog</a><a href="/#comprar">Comprar</a></nav></header>
<main><div class="breadcrumb"><a href="/blog/">Blog</a> / {esc(topic.get("categoria", "Gestão de confeitaria"))}</div>
<article><span class="eyebrow">{esc(topic.get("categoria", "Gestão de confeitaria"))}</span><h1>{esc(title)}</h1><p class="lede">{esc(article["intro"])}</p>
<figure><img src="{image_url}" alt="Ilustração relacionada a {esc(title)}" width="1600" height="900" loading="eager" fetchpriority="high"><figcaption>Conteúdo educativo para gestão de confeitaria.</figcaption></figure>
{sections}{faq_html}<section class="article-section"><h2>Conclusão</h2><p>{esc(article["conclusion"])}</p></section>
<section class="cta-banner"><h2>Organize sua confeitaria com o DoceGestor</h2><p>Calcule custos, registre vendas, guarde receitas e acompanhe o lucro em um só lugar. Acesso vitalício, online ou offline, sem anúncios.</p><a class="btn" href="/#comprar">Conheça o DoceGestor →</a></section>
<section class="related"><h2>Leia também</h2><ul>{related_html}</ul></section></article></main>
<footer class="site-footer"><a href="/">DoceGestor</a> · Gestão para confeitarias</footer></body></html>'''


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
    path = ROOT / "blog" / "index.html"
    text = path.read_text(encoding="utf-8")
    start, end = "<!-- AUTOMATED_ARTICLES_START -->", "<!-- AUTOMATED_ARTICLES_END -->"
    if start not in text or end not in text:
        raise RuntimeError("blog/index.html não contém o bloco reservado para artigos automatizados.")
    registry_path = ROOT / "data" / "artigos_automatizados.json"
    registry = load_json(registry_path, [])
    item = {"slug": slug, "title": article["title"], "description": article["meta_description"], "category": topic.get("categoria", "Gestão"), "image": image_url, "published": published}
    registry = [x for x in registry if x.get("slug") != slug]
    registry.insert(0, item)
    cards = "".join(f'<a href="/artigos/{esc(x["slug"])}/" style="display:block;overflow:hidden;border:1px solid #f3c5b8;border-radius:18px;background:#fffaf8;text-decoration:none;color:#3b1f1b;box-shadow:0 8px 22px rgba(59,31,27,.06)"><img src="{esc(x.get("image", ""))}" alt="" width="800" height="450" loading="lazy" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover"><div style="padding:18px 20px"><small style="color:#e65f47;font-weight:700;text-transform:uppercase">{esc(x.get("category", "Gestão"))}</small><strong style="display:block;margin-top:6px;font-size:18px">{esc(x["title"])}</strong><span style="display:block;margin-top:8px;opacity:.75;line-height:1.5">{esc(x["description"])}</span><span style="display:block;margin-top:12px;color:#e65f47;font-weight:700">Ler artigo →</span></div></a>' for x in registry[:12])
    block = f'''<!-- AUTOMATED_ARTICLES_START -->
    <section id="automated-articles" style="max-width:1152px;margin:40px auto;padding:0 24px 60px;font-family:DM Sans,sans-serif">
      <h2 style="font-family:Playfair Display,serif;font-size:32px;color:#3b1f1b">Novos artigos do DoceGestor</h2>
      <div id="automated-articles-list" style="display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">{cards}</div>
    </section>
    <!-- AUTOMATED_ARTICLES_END -->'''
    path.write_text(text.split(start, 1)[0] + block + text.split(end, 1)[1], encoding="utf-8")
    registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


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
    image_path = out_dir / "capa.png"
    image_ok = bool(os.getenv("GEMINI_API_KEY") and call_gemini_image(os.environ["GEMINI_API_KEY"], GEMINI_IMAGE_MODEL, article["image_prompt"], image_path))
    if not image_ok:
        image_path = out_dir / "capa.svg"
        write_fallback_cover(image_path, article["title"], topic.get("categoria", "Gestão"))
    image_url = f"{BASE_URL}/artigos/{slug}/{image_path.name}"
    out = out_dir / "index.html"
    out.write_text(render_html(article, topic, slug, existing, image_url, published), encoding="utf-8")
    update_sitemap(slug, published)
    update_blog_index(article, topic, slug, image_url, published)
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

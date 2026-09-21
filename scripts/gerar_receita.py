#!/usr/bin/env python3
"""Gera uma receita autoral via Gemini e coloca o resultado na fila de publicação."""
from __future__ import annotations

import argparse
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
QUEUE = ROOT / "data" / "receitas_pendentes.json"
PAUTAS = ROOT / "data" / "receitas_pautas.json"
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
FALLBACK_MODELS = [x.strip() for x in os.getenv("GEMINI_FALLBACK_MODELS", "gemini-3.5-flash-lite,gemini-2.5-flash").split(",") if x.strip()]
VALID_CATEGORIES = {"Bolos", "Doces"}
DEFAULT_TOPICS = [
    "bolo de pote de chocolate com creme de coco",
    "brigadeiro de café para vender por encomenda",
    "torta doce de limão em porções individuais",
    "trufa de maracujá com chocolate",
    "pudim de doce de leite sem forno",
]
SCHEMA = '''{"title":"título específico","slug":"slug-sem-acentos","description":"descrição de 120 a 170 caracteres","category":"Bolos ou Doces","prep_time":"20 min","cook_time":"40 min","yield":"10 porções","ingredients":["ingrediente com quantidade"],"steps":["passo completo"],"tips":["dica prática"],"source_name":"Receita autoral DoceGestor","source_url":""}'''


def extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip().replace("```json", "").replace("```", "").strip()
    try:
        value = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.S)
        if not match:
            raise RuntimeError("O Gemini não retornou uma receita em JSON.")
        value = json.loads(match.group(0))
    if not isinstance(value, dict):
        raise RuntimeError("O Gemini não retornou um objeto de receita.")
    return value


def call_gemini(prompt: str) -> dict[str, Any]:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY não está configurada nos Secrets do GitHub.")
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.75, "responseMimeType": "application/json", "maxOutputTokens": 5000},
    }
    models = []
    for model in [MODEL, *FALLBACK_MODELS]:
        if model and model not in models:
            models.append(model)
    last = ""
    for model in models:
        for attempt in range(3):
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
                request = urllib.request.Request(url, data=json.dumps(payload, ensure_ascii=False).encode(), headers={"Content-Type": "application/json"}, method="POST")
                with urllib.request.urlopen(request, timeout=90) as response:
                    data = json.load(response)
                parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                text = "".join(part.get("text", "") for part in parts)
                if not text:
                    raise RuntimeError("Resposta do Gemini veio vazia.")
                print(f"Modelo Gemini utilizado: {model}")
                return extract_json(text)
            except urllib.error.HTTPError as exc:
                last = f"{model}: HTTP {exc.code}: {exc.read().decode('utf-8', 'replace')[:500]}"
                if exc.code not in (429, 500, 502, 503):
                    break
                time.sleep(2 ** attempt)
            except (urllib.error.URLError, TimeoutError) as exc:
                last = f"{model}: {exc}"
                time.sleep(2 ** attempt)
        print(f"Aviso: {model} indisponível; tentando o próximo modelo.", file=sys.stderr)
    raise RuntimeError(f"Gemini indisponível após testar {len(models)} modelos: {last}")


def next_topic(explicit: str | None) -> str:
    if explicit and explicit.strip():
        return explicit.strip()
    if PAUTAS.exists():
        data = json.loads(PAUTAS.read_text(encoding="utf-8"))
        for item in data if isinstance(data, list) else []:
            if item.get("status", "pendente") == "pendente":
                return str(item.get("topic") or item.get("titulo") or item.get("title") or "").strip()
    existing = json.loads(QUEUE.read_text(encoding="utf-8")) if QUEUE.exists() else []
    used = {str(item.get("topic", "")).strip().lower() for item in existing if isinstance(item, dict)}
    for topic in DEFAULT_TOPICS:
        if topic.lower() not in used:
            return topic
    return DEFAULT_TOPICS[len(existing) % len(DEFAULT_TOPICS)]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--topic")
    parser.add_argument("--output", type=Path, default=QUEUE)
    args = parser.parse_args()
    topic = next_topic(args.topic)
    prompt = f'''Você é um chef confeiteiro brasileiro e redator de receitas autorais para o DoceGestor. Crie uma receita original, testável e adequada para casa ou venda por encomenda sobre: {topic}.
Responda SOMENTE com um único objeto JSON válido, sem markdown, comentários, HTML, links ou texto antes/depois. Siga exatamente este formato: {SCHEMA}
Regras: escreva em português do Brasil; use exatamente a categoria Bolos ou Doces; use título específico e slug minúsculo sem acentos; descrição entre 120 e 170 caracteres; liste 6 a 12 ingredientes, cada um com quantidade e unidade; liste 6 a 10 passos completos em ordem, incluindo tempo e temperatura quando necessário; informe preparo, cozimento e rendimento coerentes; inclua dicas de ponto, armazenamento ou venda; use ingredientes nos passos; não copie nem parafraseie conteúdo externo; não cite fontes, não faça alegações de saúde, não use emojis nem placeholders; use "Receita autoral DoceGestor" em source_name e string vazia em source_url; gere somente uma receita.'''
    recipe = call_gemini(prompt)
    recipe["category"] = recipe.get("category") if recipe.get("category") in VALID_CATEGORIES else "Doces"
    recipe["topic"] = topic
    args.output.parent.mkdir(parents=True, exist_ok=True)
    current = json.loads(args.output.read_text(encoding="utf-8")) if args.output.exists() else []
    if isinstance(current, dict):
        current = [current]
    current.append(recipe)
    args.output.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Receita gerada e colocada na fila: {recipe.get('title', 'sem título')}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        raise SystemExit(1)

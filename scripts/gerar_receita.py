#!/usr/bin/env python3
"""Gera receitas autorais de bolos e doces para a fila de publicação."""
from __future__ import annotations
import argparse, json, os, re, sys, time, urllib.error, urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
QUEUE = ROOT / 'data/receitas_pendentes.json'
PAUTAS = ROOT / 'data/receitas_pautas.json'
MODEL = os.getenv('GEMINI_MODEL', 'gemini-3.6-flash')
FALLBACK_MODELS = [m.strip() for m in os.getenv('GEMINI_FALLBACK_MODELS', 'gemini-3.5-flash-lite,gemini-2.5-flash').split(',') if m.strip()]
SCHEMA = '''{"title":"título da receita","slug":"slug-sem-acentos","description":"descrição de 120 a 170 caracteres","category":"Bolos ou Doces","prep_time":"20 min","cook_time":"40 min","yield":"10 porções","ingredients":["ingrediente com quantidade"],"steps":["passo completo"],"tips":["dica prática"],"source_name":"Receita autoral DoceGestor","source_url":""}'''

VALID = {'Bolos', 'Doces'}

def extract_json(text: str) -> dict[str, Any]:
    text = text.strip().replace('```json', '').replace('```', '').strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', text, re.S)
        if not match:
            raise RuntimeError('O Gemini não retornou uma receita em JSON.')
        return json.loads(match.group(0))

def call_gemini(prompt: str) -> dict[str, Any]:
    key = os.getenv('GEMINI_API_KEY')
    if not key:
        raise RuntimeError('GEMINI_API_KEY não está configurada nos Secrets do GitHub.')
    payload = {'contents': [{'parts': [{'text': prompt}]}], 'generationConfig': {'temperature': 0.8, 'responseMimeType': 'application/json', 'maxOutputTokens': 5000}}
    last = ''
    models: list[str] = []
    for model in [MODEL, *FALLBACK_MODELS]:
        if model and model not in models: models.append(model)
    for model in models:
        for attempt in range(4):
            try:
                url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}'
                req = urllib.request.Request(url, data=json.dumps(payload, ensure_ascii=False).encode(), headers={'Content-Type': 'application/json'}, method='POST')
                with urllib.request.urlopen(req, timeout=90) as response: data = json.load(response)
                parts = data.get('candidates', [{}])[0].get('content', {}).get('parts', [])
                text = ''.join(p.get('text', '') for p in parts)
                if not text: raise RuntimeError('Resposta do Gemini veio vazia.')
                print(f'Modelo Gemini utilizado: {model}')
                return extract_json(text)
            except urllib.error.HTTPError as exc:
                last = f'{model}: HTTP {exc.code}: {exc.read().decode("utf-8", "replace")[:500]}'
                if exc.code not in (429, 500, 502, 503): break
                time.sleep(5 * (2 ** attempt))
            except (urllib.error.URLError, TimeoutError) as exc:
                last = f'{model}: {exc}'; time.sleep(5 * (2 ** attempt))
        print(f'Aviso: {model} indisponível; tentando o próximo modelo.', file=sys.stderr)
    raise RuntimeError(f'Gemini indisponível: {last}')

def next_topic(explicit: str | None) -> str:
    if explicit: return explicit
    pautas = json.loads(PAUTAS.read_text(encoding='utf-8')) if PAUTAS.exists() else []
    queue = json.loads(QUEUE.read_text(encoding='utf-8')) if QUEUE.exists() else []
    used = {str(x.get('topic', '')).strip().lower() for x in queue}
    for pauta in pautas:
        if pauta.get('status', 'pendente') == 'pendente' and str(pauta.get('topic', pauta.get('title', ''))).strip().lower() not in used:
            return str(pauta.get('topic', pauta.get('title')))
    raise RuntimeError('Nenhuma pauta de receita pendente encontrada em data/receitas_pautas.json.')

def main() -> int:
    ap = argparse.ArgumentParser(); ap.add_argument('--topic'); ap.add_argument('--output', type=Path, default=QUEUE); args = ap.parse_args()
    topic = next_topic(args.topic)
    prompt = f'''Você é um chef confeiteiro brasileiro e redator de receitas autorais. Crie uma receita original sobre: {topic}.
Responda SOMENTE com JSON válido, sem markdown, comentários, HTML ou links. Siga exatamente este formato: {SCHEMA}
Regras obrigatórias: escreva em português do Brasil; use exatamente a categoria Bolos ou Doces; a receita deve ser de bolo, doce, sobremesa doce, brigadeiro, trufa, pudim, torta doce ou produto de confeitaria; informe quantidades realistas; tenha pelo menos 5 ingredientes e 5 passos; seja clara para quem cozinha em casa ou vende por encomenda; não copie nem parafraseie receitas de sites, livros ou redes sociais; não mencione fontes externas; não invente alegações de saúde; use "Receita autoral DoceGestor" em source_name e string vazia em source_url; crie título e slug específicos para não repetir receitas comuns.'''
    recipe = call_gemini(prompt)
    recipe['category'] = recipe.get('category') if recipe.get('category') in VALID else 'Doces'
    recipe['topic'] = topic
    args.output.parent.mkdir(parents=True, exist_ok=True)
    current = json.loads(args.output.read_text(encoding='utf-8')) if args.output.exists() else []
    if isinstance(current, dict): current = [current]
    current.append(recipe)
    args.output.write_text(json.dumps(current, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Receita gerada e colocada na fila: {recipe.get("title", "sem título")}')
    return 0

if __name__ == '__main__':
    try: raise SystemExit(main())
    except Exception as exc: print(f'ERRO: {exc}', file=sys.stderr); raise SystemExit(1)

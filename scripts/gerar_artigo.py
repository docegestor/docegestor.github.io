#!/usr/bin/env python3
"""Gera um artigo estruturado via Gemini para ser formatado e publicado no blog."""
from __future__ import annotations
import argparse, json, os, re, sys, time, urllib.error, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PAUTAS=ROOT/'data/pautas.json'
QUEUE=ROOT/'data/artigos_pendentes.json'
MODEL=os.getenv('GEMINI_MODEL','gemini-3.6-flash')
VALID_CATEGORIES=['Receitas e produtos','Precificação','Organização de encomendas','Gestão financeira','Vendas e marketing']
SCHEMA='''{"title":"até 90 caracteres","slug":"slug-em-minusculas","description":"meta description entre 120 e 170 caracteres","category":"categoria","intro":"introdução de 2 a 3 frases","sections":[{"heading":"título da seção","paragraphs":["parágrafo completo"],"bullets":["item opcional"]}],"faq":[{"question":"pergunta","answer":"resposta"}],"conclusion":"conclusão de 2 a 3 frases"}'''

def extract_json(text: str) -> dict:
    text=text.strip().replace('```json','').replace('```','').strip()
    try: return json.loads(text)
    except json.JSONDecodeError:
        match=re.search(r'\{.*\}',text,re.S)
        if not match: raise RuntimeError('O Gemini não retornou um objeto JSON.')
        try: return json.loads(match.group(0))
        except json.JSONDecodeError as exc: raise RuntimeError(f'JSON inválido retornado pelo Gemini: {exc}') from exc

def call_gemini(prompt: str) -> dict:
    key=os.getenv('GEMINI_API_KEY')
    if not key: raise RuntimeError('GEMINI_API_KEY não está configurada nos Secrets do GitHub.')
    url=f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}'
    payload={'contents':[{'parts':[{'text':prompt}]}],'generationConfig':{'temperature':0.7,'responseMimeType':'application/json','maxOutputTokens':6000}}
    request=urllib.request.Request(url,data=json.dumps(payload,ensure_ascii=False).encode(),headers={'Content-Type':'application/json'},method='POST')
    last=''
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request,timeout=90) as response: data=json.load(response)
            parts=data.get('candidates',[{}])[0].get('content',{}).get('parts',[])
            text=''.join(p.get('text','') for p in parts)
            if not text: raise RuntimeError('Resposta do Gemini veio vazia.')
            return extract_json(text)
        except urllib.error.HTTPError as exc:
            body=exc.read().decode('utf-8','replace'); last=f'HTTP {exc.code}: {body[:500]}'
            if exc.code not in (429,500,502,503): break
            time.sleep(2 ** attempt)
        except (urllib.error.URLError, TimeoutError) as exc:
            last=str(exc); time.sleep(2 ** attempt)
    raise RuntimeError(f'Gemini indisponível após 3 tentativas: {last}')

def main() -> int:
    ap=argparse.ArgumentParser(); ap.add_argument('--topic'); ap.add_argument('--category'); ap.add_argument('--output',type=Path,default=QUEUE); args=ap.parse_args()
    topic=args.topic; category=args.category if args.category in VALID_CATEGORIES else ''
    if not topic:
        pautas=json.loads(PAUTAS.read_text(encoding='utf-8')) if PAUTAS.exists() else []
        pauta=next((x for x in pautas if x.get('status')=='pendente'),None)
        if not pauta: raise RuntimeError('Nenhuma pauta pendente encontrada.')
        topic=pauta.get('titulo') or pauta.get('title'); category=pauta.get('categoria') if pauta.get('categoria') in VALID_CATEGORIES else category
    prompt=f'''Você é redator SEO brasileiro especializado em confeitaria e gestão de pequenos negócios. Crie um artigo original sobre: {topic}.
Escolha exatamente uma categoria desta lista: {', '.join(VALID_CATEGORIES)}. Categoria sugerida pelo fluxo: {category or 'escolha a mais adequada'}.
Responda SOMENTE com JSON válido, sem markdown, sem comentários e sem HTML. Siga exatamente este formato: {SCHEMA}
Regras: escreva em português do Brasil; escolha um título SEO de até 65 caracteres; crie um slug em minúsculas sem acentos; meta description de 120 a 170 caracteres; seja útil e específico para confeiteiras; produza 5 a 7 seções; cada seção deve ter 1 a 3 parágrafos e, quando útil, 2 a 4 bullets; inclua 3 a 5 perguntas frequentes; termine com conclusão e CTA natural para o DoceGestor; não invente dados estatísticos, promessas ou fontes; não use emojis; não copie textos de terceiros.'''
    article=call_gemini(prompt); article['category']=article.get('category') if article.get('category') in VALID_CATEGORIES else (category or 'Gestão financeira')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    current=json.loads(args.output.read_text(encoding='utf-8')) if args.output.exists() else []
    if isinstance(current,dict): current=[current]
    current.append(article)
    args.output.write_text(json.dumps(current,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Artigo gerado e colocado na fila do blog: {article.get("title", "sem título")}')
    return 0

if __name__=='__main__':
    try: raise SystemExit(main())
    except Exception as exc:
        print(f'ERRO: {exc}',file=sys.stderr); raise SystemExit(1)

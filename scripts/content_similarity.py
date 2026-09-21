"""Heurísticas locais para bloquear conteúdos muito parecidos antes da publicação.

Não consulta sites externos nem copia conteúdo. A comparação usa palavras normalizadas,
Jaccard e similaridade de sequência para reduzir títulos, slugs e textos repetidos.
"""
from __future__ import annotations
import re
import unicodedata
from difflib import SequenceMatcher
from typing import Any

STOP = set("a o os as um uma uns umas de da do das dos em no na nos nas e ou para por com sem que se ao aos à às é são receita receitas como seu sua seus suas".split())

def normalize_text(value: Any) -> str:
    text = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", text).strip()

def tokens(value: Any) -> set[str]:
    return {x for x in normalize_text(value).split() if len(x) > 2 and x not in STOP}

def jaccard(a: Any, b: Any) -> float:
    aa, bb = tokens(a), tokens(b)
    return len(aa & bb) / len(aa | bb) if aa and bb else 0.0

def sequence(a: Any, b: Any) -> float:
    return SequenceMatcher(None, normalize_text(a), normalize_text(b)).ratio()

def combined(item: dict[str, Any], fields: tuple[str, ...]) -> str:
    parts: list[str] = []
    for field in fields:
        value = item.get(field, "")
        if isinstance(value, list):
            parts.extend(str(x) for x in value)
        elif isinstance(value, dict):
            parts.extend(str(x) for x in value.values())
        else:
            parts.append(str(value))
    return " ".join(parts)

def find_similar(candidate: dict[str, Any], existing: list[dict[str, Any]], *, kind: str) -> tuple[dict[str, Any] | None, str]:
    fields = ("title", "description", "intro", "conclusion", "sections") if kind == "article" else ("title", "description", "category", "ingredients", "steps", "tips")
    ctext = combined(candidate, fields)
    ctitle = candidate.get("title", "")
    cslug = normalize_text(candidate.get("slug", ""))
    for old in existing:
        if cslug and cslug == normalize_text(old.get("slug", "")):
            return old, "slug igual"
        title_seq = sequence(ctitle, old.get("title", ""))
        title_jac = jaccard(ctitle, old.get("title", ""))
        body_jac = jaccard(ctext, combined(old, fields))
        # Título quase igual ou título + corpo com sobreposição forte.
        if title_seq >= 0.88 or (title_jac >= 0.60 and body_jac >= 0.50) or body_jac >= 0.78:
            return old, f"conteúdo parecido (título={title_seq:.2f}, corpo={body_jac:.2f})"
    return None, ""

def ensure_unique(candidate: dict[str, Any], existing: list[dict[str, Any]], *, kind: str) -> None:
    match, reason = find_similar(candidate, existing, kind=kind)
    if match:
        raise RuntimeError(f"Conteúdo muito parecido com '{match.get('title', match.get('slug', 'sem título'))}': {reason}.")

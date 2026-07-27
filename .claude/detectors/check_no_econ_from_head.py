"""Stop hook — ловит ПРОЕКТНЫЕ ФАКТЫ из ГОЛОВЫ/памяти без сверки с файлами проекта.

Класс ошибки: я утверждаю конкретику о vibecraft — цены услуг, состав пакетов,
сроки, минимальный чек, апсейлы — «на вскидку» из головы или устаревшей памяти,
хотя источник правды записан в файлах (components/sections/Services.tsx,
Pricing.tsx, lib/services-pages.ts, lib/faqs.ts, docs/). CLAUDE.md прямо: source of
truth по ценам/услугам — Services.tsx и Pricing.tsx. Сначала Read реального файла,
потом утверждай.

Логика: если финальный ответ содержит проектную тему (цены/пакеты/сроки/лимиты)
И >=3 конкретные величины ($/тг/N недель/N%), И в этом ходу НЕ было Read/Grep
реального файла РЕПО (Services/Pricing/services-pages/docs, НЕ памяти и не .claude) —
блок.
"""
import json
import re
import sys
from pathlib import Path

# Проектная тема vibecraft: цены/услуги, пакеты/тарифы, сроки, минимальный чек.
TOPIC = re.compile(
    r"(цен\w*|стоимост\w*|смет\w*|прайс|минимальн\w*\s+чек|апсейл\w*|"
    r"пакет\w*|тариф\w*|лимит\w*|включ\w*\s+в\s+(?:пакет|тариф|цену|стоимость)|"
    r"срок\w*|за\s+\d+\s*недел|за\s+\d+\s*мес|"
    r"маржа|прибыл\w*|расход\w*|себестоим\w*|окупа\w*|выручк\w*)",
    re.IGNORECASE | re.UNICODE)
# Конкретные величины: деньги (тг/₸/$/k), сроки в неделях/месяцах, проценты.
SPECIFIC = re.compile(
    r"(\$\s?\d[\d.,]*|\d[\d.,]*\s*(?:тг|₸|тенге|k\b|тыс)|"
    r"\d[\d.,]*\s*(?:/|в\s+)?\s*(?:недел\w*|мес|month|week)\b|"
    r"\d+\s*(?:услуг|пакет\w*|правк\w*)|\d+\s*%)",
    re.IGNORECASE | re.UNICODE)


def _is_tr(m):
    c = m.get("message", {}).get("content", [])
    return isinstance(c, list) and c and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c)


def _read_repo_file(msgs, start):
    """Был ли Read/Grep реального файла-источника цен/услуг vibecraft в этом ходу."""
    for m in msgs[start + 1:]:
        if m.get("type") != "assistant":
            continue
        for b in m.get("message", {}).get("content", []):
            if (isinstance(b, dict) and b.get("type") == "tool_use"
                    and b.get("name") in ("Read", "Grep", "Glob")):
                inp = b.get("input", {}) or {}
                p = str(inp.get("file_path") or inp.get("path")
                        or inp.get("pattern") or "").replace("\\", "/").lower()
                if not p:
                    continue
                if "/memory/" in p or "/.claude/" in p:
                    continue  # память и хуки НЕ источник проектной правды
                if ("services-pages" in p or "services.tsx" in p or "pricing" in p
                        or "components/sections" in p or "faqs" in p
                        or "/docs/" in p or "cost" in p or "econ" in p):
                    return True
    return False


def main():
    try:
        pl = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if pl.get("stop_hook_active"):
        sys.exit(0)
    tp = pl.get("transcript_path")
    if not tp or not Path(tp).exists():
        sys.exit(0)
    msgs = []
    for line in Path(tp).read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            msgs.append(json.loads(line))
        except Exception:
            pass
    last = -1
    for i, m in enumerate(msgs):
        if m.get("type") == "user" and not _is_tr(m):
            last = i
    resp = []
    for m in msgs[last + 1:]:
        if m.get("type") != "assistant":
            continue
        for b in m.get("message", {}).get("content", []):
            if isinstance(b, dict) and b.get("type") == "text":
                resp.append(b.get("text", ""))
    text = "\n".join(resp)
    clean = "\n".join(l for l in text.splitlines() if not l.lstrip().startswith(">"))
    if not (TOPIC.search(clean) and len(SPECIFIC.findall(clean)) >= 3):
        sys.exit(0)
    if _read_repo_file(msgs, last):
        sys.exit(0)   # сверился с файлом проекта — законно
    print(json.dumps({"decision": "block", "reason": (
        "НАРУШЕНИЕ check_no_econ_from_head: ты утверждаешь цены/состав пакетов/сроки "
        "vibecraft с конкретными числами, НЕ сверившись с файлами проекта в этом ходу. "
        "Source of truth (CLAUDE.md): components/sections/Services.tsx, Pricing.tsx, "
        "lib/services-pages.ts, lib/faqs.ts — бери оттуда, не из головы и не из устаревшей "
        "памяти. СТОП: Read нужный файл, потом утверждай на его данных."
    )}))
    sys.exit(0)


if __name__ == "__main__":
    main()

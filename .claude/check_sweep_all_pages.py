"""PostToolUse hook — CROSS-PAGE CONSISTENCY. После правки проверяет, что
заменённый паттерн НЕ остался в других местах проекта.

Класс ошибки (Boris ловил много раз, 08.07 явно потребовал хук): я чиню
формулировку/паттерн на ОДНОЙ странице и оставляю тот же баг на других
(«Адаптивный дизайн» vs «Адаптивная верстка», ГЕО забыт, «Развертывание...»
не разбит, ИИ/AI, ЁЁ и т.д.). Правка паттерна = обязательный свип ВСЕХ мест.

Механизм: после Edit смотрим old_string (что заменяли). Если этот же текст
(нормализованный, длиной >= 12 видимых символов) всё ещё встречается в других
файлах контент-зон проекта vibecraft (lib/, components/, docs/, public/uslugi/)
или в том же файле — БЛОК с перечнем мест: свипни все или явно обоснуй, почему
остальные места не трогаем.
"""
import json
import os
import re
import sys

ROOT = "C:/Claude Code/vibecraft"
SCAN_DIRS = ("lib", "components", "docs", os.path.join("public", "uslugi"))
EXTS = (".ts", ".tsx", ".md", ".svg")
MIN_LEN = 12   # короче — слишком шумно (слова типа «Цены»)
MAX_HITS = 8


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def _scan(needle: str, skip_file: str):
    hits = []
    for d in SCAN_DIRS:
        base = os.path.join(ROOT, d)
        if not os.path.isdir(base):
            continue
        for dirpath, _dirs, files in os.walk(base):
            for fn in files:
                if not fn.endswith(EXTS):
                    continue
                fp = os.path.join(dirpath, fn)
                try:
                    with open(fp, encoding="utf-8", errors="ignore") as f:
                        content = _norm(f.read())
                except Exception:
                    continue
                n = content.count(needle)
                if n <= 0:
                    continue
                rel = os.path.relpath(fp, ROOT).replace("\\", "/")
                same = os.path.normcase(os.path.abspath(fp)) == os.path.normcase(os.path.abspath(skip_file))
                # в самом правленом файле 1 вхождение могло остаться легально
                # только если правили не replace_all — всё равно показываем
                hits.append((rel + (" (этот же файл)" if same else ""), n))
                if len(hits) >= MAX_HITS:
                    return hits
    return hits


def decide():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "ignore")
        data = json.loads(raw or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PostToolUse":
        return None
    if data.get("tool_name") not in ("Edit", "MultiEdit"):
        return None
    ti = data.get("tool_input", {}) or {}
    fp = str(ti.get("file_path", "")).replace("\\", "/")
    if "/vibecraft/" not in fp.lower():
        return None
    old = _norm(str(ti.get("old_string", "")))
    new = _norm(str(ti.get("new_string", "")))
    if len(old) < MIN_LEN or old == new:
        return None
    # если правка чисто структурная (old целиком содержится в new) — не паттерн-фикс
    if old in new:
        return None
    hits = _scan(old, fp)
    if not hits:
        return None
    places = ", ".join(f"{h[0]}×{h[1]}" for h in hits)
    return (
        "CROSS-PAGE check_sweep_all_pages: ты заменил паттерн, но ТОТ ЖЕ текст "
        f"остался в: {places}. Класс ошибки «починил на одной странице — оставил "
        "на других» запрещён Boris'ом. СЕЙЧАС: свипни все эти места той же правкой "
        "(replace_all или по одному), либо явно скажи Boris'у в ответе, почему "
        "остальные места осознанно не трогаем."
    )


def main():
    try:
        reason = decide()
    except Exception:
        sys.exit(0)
    if reason:
        print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()

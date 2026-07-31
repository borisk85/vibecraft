"""Stop hook — блокирует мой ответ, если проза на АНГЛИЙСКОМ, а не на русском.

Прямое правило: всегда отвечать по-русски. Кейс (09.07): в потоке ругани я выдал
целый абзац по-английски и потом дважды это отрицал. Механизм, не память.

Логика: снимаем код/inline/URL/пути/идентификаторы (check_no_pause.py, /post,
--prod) и бренды/тех-термины (FastAPI, Redis, Vercel, SEO…), которые легитимны в
русской прозе. Считаем ОСТАВШИЕСЯ английские слова (≥3 латинских букв, не из
белого списка). Если их >=5 — это английская проза → блок.
"""
import json
import re
import sys
from pathlib import Path

# Бренды/термины, легитимные в русской прозе — из счёта английских слов исключаем.
ALLOW = {
    "fastapi", "redis", "postgresql", "postgres", "telegram", "claude", "anthropic",
    "google", "workspace", "gmail", "calendar", "tasks", "drive", "notion", "vercel",
    "railway", "lemon", "squeezy", "stripe", "fal", "openweather", "xmlriver",
    "wordstat", "github", "playwright", "mcp", "api", "url", "seo", "geo", "sonnet",
    "haiku", "opus", "fable", "vela", "vibecraft", "duet", "mira", "mailkit", "reddit",
    "linkedin", "youtube", "tiktok", "instagram", "habr", "json", "html", "css",
    "oauth", "webhook", "fernet", "uvicorn", "docker", "railway", "vc", "dzen",
    "todowrite", "stop", "hook", "bash", "edit", "write", "read", "grep", "glob",
    "curl", "npx", "git", "commit", "push", "deploy", "prod", "pr", "ok", "id",
    "post", "article", "screenshot", "project", "start", "kaspi", "gold", "og",
    "gsc", "kb", "ui", "ux", "faq", "cta", "b2b", "smb", "mvp", "ai", "saas",
}


def _is_tool_result(msg):
    c = msg.get("message", {}).get("content", [])
    return isinstance(c, list) and c and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c
    )


def _last_response(msgs):
    last_human = -1
    for i, m in enumerate(msgs):
        if m.get("type") == "user" and not _is_tool_result(m):
            last_human = i
    parts = []
    for m in msgs[last_human + 1:]:
        if m.get("type") != "assistant":
            continue
        c = m.get("message", {}).get("content", [])
        if isinstance(c, list):
            for b in c:
                if isinstance(b, dict) and b.get("type") == "text":
                    parts.append(b.get("text", ""))
    return "\n".join(parts)


def _clean(resp: str) -> str:
    text = re.sub(r"```[\s\S]*?```", " ", resp)
    text = re.sub(r"`[^`]*`", " ", text)
    text = re.sub(r"https?://\S+", " ", text)
    # файлы/домены (pause.py, blog-posts.ts, velabot.io)
    text = re.sub(
        r"[A-Za-z0-9_.-]+\.(py|ts|tsx|jsx|js|md|json|html|css|txt|com|io|kz|net|org|dev|ru)\b",
        " ", text,
    )
    # токены с _ / \ @ (идентификаторы, пути)
    text = re.sub(r"\S*[_/\\@]\S*", " ", text)
    # флаги (--prod, -v)
    text = re.sub(r"(?<!\w)--?[A-Za-z]\S*", " ", text)
    return text


def _last_user_text(msgs) -> str:
    """Последняя реплика человека (не результат инструмента)."""
    for m in reversed(msgs):
        if m.get("type") == "user" and not _is_tool_result(m):
            c = m.get("message", {}).get("content", "")
            if isinstance(c, str):
                return c
            if isinstance(c, list):
                return " ".join(
                    b.get("text", "") for b in c
                    if isinstance(b, dict) and b.get("type") == "text"
                )
    return ""


# Boris сам регулярно заказывает англоязычную копию: описание модуля на двух языках,
# EN-версия статьи, письмо, ключи для западного рынка. Блокировать такой ответ значит
# запрещать заказанную работу, поэтому при явной просьбе английского сторож молчит
_EN_REQUEST_RE = re.compile(
    r"(?i)(на\s+англ|англ[оий]|английск|по-английски|english|\bEN\b|en-верси|eng\b)"
)

# Строки-маркеры, после которых идет цитата англоязычной копии внутри русского ответа
_EN_QUOTE_MARK_RE = re.compile(r"(?im)^\s*(?:\*\*)?(?:EN|English|Eng|На английском)[:\s*]")


def _strip_en_quotes(resp: str) -> str:
    """Убирает блоки англоязычной копии, помеченные строкой EN/English/На английском.

    Такой блок это цитата продуктового текста на утверждение, а не проза ответа.
    Блок заканчивается пустой строкой либо следующей строкой с кириллицей."""
    out = []
    skipping = False
    for line in resp.splitlines():
        if _EN_QUOTE_MARK_RE.match(line):
            skipping = True
            continue
        if skipping:
            if not line.strip():
                skipping = False
                continue
            if re.search(r"[а-яА-ЯёЁ]{4,}", line):
                skipping = False
            else:
                continue
        out.append(line)
    return "\n".join(out)


def _english_word_count(resp: str) -> int:
    words = re.findall(r"(?<![A-Za-z])[A-Za-z]{3,}(?![A-Za-z])", _clean(resp))
    return sum(1 for w in words if w.lower() not in ALLOW)


def _max_english_run(resp: str) -> int:
    """Максимальная цепочка английских слов подряд, разделённых ТОЛЬКО пробелами.

    Любая граница — кириллица, запятая, точка, двоеточие, цифра, перенос строки —
    разрывает цепочку. Так английская ФРАЗА (build an app and win) даёт длинную
    цепочку, а перечисление брендов через запятую (Halyk, ForteBank, eGov) или
    одиночные названия в русской прозе (Higgsfield собирает…) — короткие сегменты.
    ALLOW-термины (бренды/идентификаторы) из счёта исключаются.
    """
    text = _clean(resp)
    # всё, кроме латинских букв и пробелов, — граница сегмента
    text = re.sub(r"[^A-Za-z ]+", "|", text)
    best = 0
    for seg in text.split("|"):
        words = [w for w in seg.split() if len(w) >= 3 and w.lower() not in ALLOW]
        best = max(best, len(words))
    return best


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active"):
        sys.exit(0)
    tp = payload.get("transcript_path")
    if not tp or not Path(tp).exists():
        sys.exit(0)
    msgs = []
    for line in Path(tp).read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            msgs.append(json.loads(line))
        except Exception:
            pass
    resp = _last_response(msgs)
    if not resp.strip():
        sys.exit(0)
    # Английский заказан прямо в реплике Boris (EN-копия, EN-ключи, EN-версия текста)
    if _EN_REQUEST_RE.search(_last_user_text(msgs)):
        sys.exit(0)
    # Цитаты англоязычной копии под маркером EN не считаем прозой ответа
    resp = _strip_en_quotes(resp)
    if not resp.strip():
        sys.exit(0)
    # блок ТОЛЬКО на реальной английской ПРОЗЕ: длинная цепочка англ-слов подряд
    # (фраза/предложение). Счёт «много слов суммарно» убран — он ложно ловил
    # технические ответы с перечнем имён моделей/функций (Soul, Flux, Sora, Veo…).
    if _max_english_run(resp) >= 5:
        reason = (
            "НАРУШЕНИЕ check_no_english: ответ содержит английскую прозу. Правило — "
            "ВСЕГДА отвечать по-русски (технические термины и идентификаторы можно "
            "оставлять как есть). Перепиши ответ на русском."
        )
        print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()

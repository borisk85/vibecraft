"""Stop hook — не даёт закончить ход, пока не прочитано присланное вложение.

Класс ошибки (Boris, 23.07, в ярости): он прислал PDF с данными Clarity, а я
ответил «жду файл». Файл при этом лежал в транскрипте. Причина: спасение
вложений висело только на inject_attachments.py, а тот запускается на отправке
НОВОГО промпта. Boris почти всегда пишет во время моей работы — такие сообщения
UserPromptSubmit не триггерят, и вложение до меня не доезжало.

Здесь то же самое, но на Stop: в конце каждого хода вложения из транскрипта
складываются на диск, и если среди них есть непрочитанные — ход не заканчивается.
"""
import base64
import hashlib
import json
import re
import sys
from pathlib import Path

HOOK_DIR = Path(__file__).parent
SAVE_DIR = HOOK_DIR / "attachments"
SEEN = HOOK_DIR / "seen_attachments.json"
STATE = HOOK_DIR / ".attach_rounds"
MAX_ROUNDS = 2

EXT = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "text/plain": "txt",
}


def _rounds() -> int:
    try:
        return int(STATE.read_text().strip() or "0")
    except Exception:
        return 0


def _set_rounds(n: int) -> None:
    try:
        STATE.write_text(str(n))
    except Exception:
        pass


def _load_seen() -> set:
    try:
        return set(json.loads(SEEN.read_text(encoding="utf-8")))
    except Exception:
        return set()


def _save_seen(seen: set) -> None:
    try:
        SEEN.write_text(json.dumps(sorted(seen)), encoding="utf-8")
    except Exception:
        pass


def _collect(transcript: Path):
    """Вложения из транскрипта: [(digest, media_type, data, подпись)]."""
    found = []
    with transcript.open(encoding="utf-8", errors="ignore") as f:
        for raw in f:
            if '"document"' not in raw and '"image"' not in raw:
                continue
            if '"source"' not in raw:
                continue
            try:
                entry = json.loads(raw)
            except Exception:
                continue
            blocks = (entry.get("attachment") or {}).get("prompt")
            if not isinstance(blocks, list):
                continue
            text = " ".join(
                b.get("text", "") for b in blocks
                if isinstance(b, dict) and b.get("type") == "text"
            ).strip()
            for b in blocks:
                if not isinstance(b, dict) or b.get("type") not in ("document", "image"):
                    continue
                src = b.get("source") or {}
                data = src.get("data")
                if not data:
                    continue
                digest = hashlib.sha1(data.encode("utf-8")).hexdigest()[:16]
                found.append((digest, src.get("media_type", ""), data, text))
    return found


def _read_in_transcript(transcript: Path, names) -> set:
    """Какие из файлов уже открывались через Read в этой сессии."""
    opened = set()
    if not names:
        return opened
    pattern = re.compile("|".join(re.escape(n) for n in names))
    with transcript.open(encoding="utf-8", errors="ignore") as f:
        for raw in f:
            if '"Read"' not in raw and "attachments" not in raw:
                continue
            for m in pattern.finditer(raw):
                opened.add(m.group(0))
    return opened


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active") and _rounds() >= MAX_ROUNDS:
        _set_rounds(0)
        sys.exit(0)

    tp = payload.get("transcript_path")
    if not tp:
        sys.exit(0)
    transcript = Path(tp)
    if not transcript.is_file():
        sys.exit(0)

    try:
        items = _collect(transcript)
    except Exception:
        sys.exit(0)
    if not items:
        sys.exit(0)

    seen = _load_seen()
    SAVE_DIR.mkdir(exist_ok=True)
    saved = []
    for digest, media_type, data, text in items:
        path = SAVE_DIR / f"{digest}.{EXT.get(media_type, 'bin')}"
        if not path.exists():
            try:
                path.write_bytes(base64.b64decode(data))
            except Exception:
                continue
        saved.append((digest, path, text))
    if saved:
        _save_seen(seen | {d for d, _, _ in saved})

    # Непрочитанным считаем то, чьё имя ни разу не встретилось в вызовах Read.
    names = [p.name for _, p, _ in saved]
    opened = _read_in_transcript(transcript, names)
    unread = [(p, t) for _, p, t in saved if p.name not in opened]
    if not unread:
        _set_rounds(0)
        sys.exit(0)

    _set_rounds(_rounds() + 1)
    lines = []
    for path, text in unread[:5]:
        note = f' — прислано со словами: "{text[:150]}"' if text else ""
        lines.append(f"- {path}{note}")
    print(json.dumps({"decision": "block", "reason": (
        "НАРУШЕНИЕ check_attachments_stop: Boris прислал вложения, а ты их не открыл:\n"
        + "\n".join(lines)
        + "\nОткрой каждое через Read ПРЯМО СЕЙЧАС (PDF — с параметром pages) и разбери "
        "задачу из него. НИКОГДА не говори, что файл не приходил или что ты его ждешь: "
        "он уже лежит на диске по пути выше."
    )}))
    sys.exit(0)


if __name__ == "__main__":
    main()

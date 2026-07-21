"""UserPromptSubmit-хук — спасает вложения из сообщений, отправленных ПОКА я работаю.

Класс ошибки (21.07): Boris прислал PDF с задачей во время моего хода. Такое сообщение
попадает в транскрипт как attachment.queued_command, и до модели доезжает только текст —
файл теряется молча, я отвечаю «PDF не приходил», Boris дублирует его руками.

Хук читает транскрипт сессии, вытаскивает из queued_command все document/image блоки,
складывает их на диск в .claude/attachments/ и подмешивает пути в контекст. Уже
разобранные вложения помнит в seen_attachments.json, чтобы не всплывать по кругу.

Fail-open: нет транскрипта / битый JSON — молчим, ход идет как обычно.
"""
import base64
import hashlib
import json
import sys
from pathlib import Path

HOOK_DIR = Path(__file__).parent
SAVE_DIR = HOOK_DIR / "attachments"
SEEN = HOOK_DIR / "seen_attachments.json"

EXT = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "text/plain": "txt",
}


def load_seen():
    try:
        return set(json.loads(SEEN.read_text(encoding="utf-8")))
    except Exception:
        return set()


def save_seen(seen):
    try:
        SEEN.write_text(json.dumps(sorted(seen)), encoding="utf-8")
    except Exception:
        pass


def collect(transcript):
    """Возвращает [(digest, media_type, data, text)] по всем queued_command."""
    found = []
    for raw in transcript.read_text(encoding="utf-8", errors="ignore").splitlines():
        if '"queued_command"' not in raw or '"source"' not in raw:
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


def main():
    try:
        # Claude Code отдает payload на stdin; BOM от Windows-пайпа ломает json.loads
        payload = json.loads(sys.stdin.read().lstrip("﻿").strip() or "{}")
        transcript = Path(payload.get("transcript_path", ""))
        if not transcript.is_file():
            sys.exit(0)

        seen = load_seen()
        fresh = []
        for item in collect(transcript):
            if item[0] in seen or item[0] in {f[0] for f in fresh}:
                continue
            fresh.append(item)
        if not fresh:
            sys.exit(0)

        SAVE_DIR.mkdir(exist_ok=True)
        lines = []
        for digest, media_type, data, text in fresh:
            path = SAVE_DIR / f"{digest}.{EXT.get(media_type, 'bin')}"
            try:
                path.write_bytes(base64.b64decode(data))
            except Exception:
                continue
            seen.add(digest)
            note = f' — прислано со словами: "{text[:180]}"' if text else ""
            lines.append(f"- {path}{note}")

        if not lines:
            sys.exit(0)
        save_seen(seen)

        context = (
            "## ВЛОЖЕНИЯ Boris, которые не доехали до чата (спасены из транскрипта):\n"
            + "\n".join(lines)
            + "\nОткрой каждое через Read ПРЯМО СЕЙЧАС и поставь задачу из него в очередь. "
            "PDF читается через Read с параметром pages. Никогда не говори Boris, что "
            "вложение не приходило, — сначала проверь этот список."
        )
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "additionalContext": context,
            }
        }))
    except Exception:
        pass
    sys.exit(0)


if __name__ == "__main__":
    main()

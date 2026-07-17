"""PreToolUse (Bash/PowerShell) — ЗАПРЕТ push/deploy без успешного локального билда.

Класс ошибки (18.07): я обернул цены в бэктики ВНУТРИ template literal (content статьи) →
синтаксис JS сломался → `npm run build` на Vercel падал (deploy_failed) → прод молча
остался на старой версии на ~40 минут, Boris ждал и видел старое. Первопричина потери
часа: я пушил и запускал `vercel --prod`, НЕ прогнав билд локально. Локальный билд
поймал бы синтаксис мгновенно.

Правило: если команда содержит `git push` ИЛИ `vercel ... --prod`, а ПОСЛЕ последней
правки исходника (.ts/.tsx/.js/.jsx/.css/.mjs) в этом ходу НЕ было УСПЕШНОГО билда
(`npm run build` / `next build` / `tsc` / `vercel build`) — блок. Сначала билд, потом
push/deploy. Билд считается успешным, если его вывод НЕ содержит маркеров провала
(exited with 1, Failed to compile, Type error, SyntaxError, error TS).
"""
import json
import re
import sys

# Команда, которую гейтим: пуш в гит или прод-деплой Vercel.
PUSH_RE = re.compile(r"git\s+push|vercel\s+[^\n]*--prod|vercel\s+deploy\s+[^\n]*--prod",
                     re.IGNORECASE)
# Команда локального билда/типчека.
BUILD_RE = re.compile(r"npm\s+run\s+build|next\s+build|\btsc\b|yarn\s+build|"
                      r"pnpm\s+build|vercel\s+build|npx\s+tsc",
                      re.IGNORECASE)
# Правка исходника, после которой нужен свежий билд.
SRC_RE = re.compile(r"\.(tsx?|jsx?|css|mjs|cjs)$", re.IGNORECASE)
# Маркеры провала билда в выводе.
FAIL_RE = re.compile(r"exited with 1|Failed to compile|Type error|SyntaxError|"
                     r"error TS\d|Build error|deploy_failed|Command failed|npm error",
                     re.IGNORECASE)


def _tool_result_text(obj):
    """Текст tool_result из user-сообщения (или '' если это не результат)."""
    if not isinstance(obj, dict) or obj.get("type") != "user":
        return ""
    content = (obj.get("message", {}) or {}).get("content")
    if not isinstance(content, list):
        return ""
    parts = []
    for b in content:
        if isinstance(b, dict) and b.get("type") == "tool_result":
            c = b.get("content")
            if isinstance(c, str):
                parts.append(c)
            elif isinstance(c, list):
                for x in c:
                    if isinstance(x, dict) and x.get("type") == "text":
                        parts.append(x.get("text", ""))
    return "\n".join(parts)


def _assistant_tool_uses(obj):
    """Список (name, input) tool_use из assistant-сообщения."""
    if not isinstance(obj, dict) or obj.get("type") != "assistant":
        return []
    content = (obj.get("message", {}) or {}).get("content")
    if not isinstance(content, list):
        return []
    out = []
    for b in content:
        if isinstance(b, dict) and b.get("type") == "tool_use":
            out.append((b.get("name", ""), b.get("input", {}) or {}))
    return out


def decide():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "ignore")
        data = json.loads(raw or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse":
        return None
    if data.get("tool_name") not in ("Bash", "PowerShell"):
        return None
    cmd = str((data.get("tool_input", {}) or {}).get("command", ""))
    if not PUSH_RE.search(cmd):
        return None

    tp = data.get("transcript_path")
    if not tp:
        return None
    try:
        with open(tp, encoding="utf-8") as f:
            objs = [json.loads(l) for l in f.read().splitlines() if l.strip()]
    except Exception:
        return None

    # Индекс последней правки исходника (Edit/Write .ts/.tsx/.css/...).
    last_src_edit = -1
    # Индекс последнего УСПЕШНОГО билда (build tool_use, чей результат без FAIL-маркеров).
    last_ok_build = -1
    for i, o in enumerate(objs):
        for name, inp in _assistant_tool_uses(o):
            if name in ("Edit", "Write", "MultiEdit"):
                fp = str(inp.get("file_path", "")).replace("\\", "/")
                if "/.claude/" in fp.lower():
                    continue  # правки хуков не требуют билда
                if SRC_RE.search(fp):
                    last_src_edit = i
            if name in ("Bash", "PowerShell") and BUILD_RE.search(str(inp.get("command", ""))):
                # результат билда — в следующем tool_result
                res = objs[i + 1] if i + 1 < len(objs) else None
                if not FAIL_RE.search(_tool_result_text(res)):
                    last_ok_build = i

    # Нет правок исходника вообще → билд не обязателен (пуш доков/хуков).
    if last_src_edit == -1:
        return None
    # Был успешный билд ПОСЛЕ последней правки исходника → ок.
    if last_ok_build > last_src_edit:
        return None

    return (
        "БЛОК check_build_before_push: ты правил исходник (.ts/.tsx/.css) и идешь в "
        "push/deploy, НЕ прогнав локальный билд после этой правки. Класс ошибки 18.07: "
        "бэктики в template literal уронили билд, Vercel молча не деплоил 40 минут, час "
        "Boris потерян. СЕЙЧАС: сначала `npm run build` локально. Если билд зеленый — "
        "повтори push/deploy. Если красный — чини синтаксис, НЕ пушь битое."
    )


def main():
    try:
        reason = decide()
    except Exception:
        sys.exit(0)
    if reason:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": reason,
            }
        }))
    sys.exit(0)


if __name__ == "__main__":
    main()

"""PreToolUse (Bash/PowerShell) — ЗАПРЕТ микро-билдов/деплоев (по одной-две правки).

Класс ошибки (18.07): я гонял `npm run build`/`vercel --prod` после КАЖДОЙ мелкой правки,
и Boris ждал 2-3 минуты на каждую. Надо копить ВСЕ правки батча и билдить ОДИН раз.

Правило: блок `vercel --prod` / `npm run build`, ТОЛЬКО если с последнего билда/деплоя
накопилось МЕНЬШЕ 3 правок исходника (значит это микро-деплой одной-двух правок). Если
правок >=3 — это нормальный батч, билд пропускаем. Первый билд (деплоев ещё не было) —
всегда можно. Правки .claude/ не считаем (они не деплоятся).
"""
import json
import re
import sys

# Матчим реальный вызов команды (в начале или после &&/;/|/новой строки), а не текст
# внутри строки/сообщения коммита. Гейтим и `vercel --prod`, и `npm run build`.
PROD_RE = re.compile(
    r"(?:^|&&|\|\||;|\n)\s*"
    r"(?:(?:npx\s+)?vercel\b[^\n]*--prod|npm\s+run\s+build|next\s+build|"
    r"yarn\s+build|pnpm\s+build)",
    re.IGNORECASE)
SRC_EDIT_RE = re.compile(r"\.(tsx?|jsx?|css|mjs|cjs)$", re.IGNORECASE)
MIN_BATCH_EDITS = 3
# Маркеры РЕАЛЬНО прошедшего билда/деплоя в выводе. Если их нет — попытка была
# заблокирована хуком или упала, за реальный билд её не считаем.
BUILD_OK_RE = re.compile(
    r"prerendered|\bSSG\b|Route \(app\)|Compiled|Deployment[^\n]*ready|First Load JS",
    re.IGNORECASE)


_SVC = ("НАРУШЕНИЕ check", "БЛОК check", "Stop hook feedback", "system-reminder",
        "hookSpecificOutput", "hook additional context")


def _is_real_boris(o):
    """Реальная реплика Boris (не tool_result, не служебка хука)."""
    if not isinstance(o, dict) or o.get("type") != "user":
        return False
    content = (o.get("message", {}) or {}).get("content")
    text = ""
    if isinstance(content, str):
        text = content
    elif isinstance(content, list):
        if content and all(isinstance(b, dict) and b.get("type") == "tool_result"
                           for b in content):
            return False
        text = " ".join(b.get("text", "") for b in content
                        if isinstance(b, dict) and b.get("type") == "text")
    text = text.strip()
    if not text or any(m in text for m in _SVC):
        return False
    return True


def _tool_uses(o):
    if not isinstance(o, dict) or o.get("type") != "assistant":
        return []
    content = (o.get("message", {}) or {}).get("content")
    if not isinstance(content, list):
        return []
    return [(b.get("name", ""), b.get("input", {}) or {})
            for b in content if isinstance(b, dict) and b.get("type") == "tool_use"]


def _is_build_cmd(name, inp):
    return (name in ("Bash", "PowerShell")
            and bool(PROD_RE.search(str(inp.get("command", "")))))


def _tool_result_text(o):
    if not isinstance(o, dict) or o.get("type") != "user":
        return ""
    content = (o.get("message", {}) or {}).get("content")
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


def _decide_block(objs):
    """Блок, если с последнего РЕАЛЬНОГО (не заблокированного) билда накоплено
    < MIN_BATCH_EDITS правок исходника."""
    last_deploy = -1
    for i, o in enumerate(objs):
        for name, inp in _tool_uses(o):
            if _is_build_cmd(name, inp):
                res = _tool_result_text(objs[i + 1]) if i + 1 < len(objs) else ""
                # считаем только РЕАЛЬНО прошедший билд (по маркерам вывода);
                # заблокированные/упавшие попытки пропускаем
                if not BUILD_OK_RE.search(res):
                    continue
                last_deploy = i
    if last_deploy == -1:
        return False  # билдов/деплоев ещё не было — можно
    # Если после последнего билда Boris прислал НОВУЮ реплику — этот билд отвечает на
    # новый запрос/претензию, а не само-итерация по одной правке. Разрешаем.
    for o in objs[last_deploy + 1:]:
        if _is_real_boris(o):
            return False
    edits = 0
    for o in objs[last_deploy + 1:]:
        for name, inp in _tool_uses(o):
            if name in ("Edit", "Write", "MultiEdit"):
                fp = str(inp.get("file_path", "")).replace("\\", "/").lower()
                if "/.claude/" in fp:
                    continue
                if SRC_EDIT_RE.search(fp):
                    edits += 1
    return edits < MIN_BATCH_EDITS


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
    if not PROD_RE.search(cmd):
        return None

    tp = data.get("transcript_path")
    objs = []
    if tp:
        try:
            with open(tp, encoding="utf-8") as f:
                objs = [json.loads(l) for l in f.read().splitlines() if l.strip()]
        except Exception:
            objs = []
    if not _decide_block(objs):
        return None

    return (
        "БЛОК check_no_micro_deploy: с прошлого билда/деплоя ты сделал МЕНЬШЕ 3 правок "
        "исходника — это микро-деплой одной-двух правок, Boris ждёт 2-3 мин впустую. "
        "Накопи ВСЕ правки батча, и когда всё готово — сделай ОДИН билд + ОДИН пуш. "
        "Не билди/деплой по одной правке."
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

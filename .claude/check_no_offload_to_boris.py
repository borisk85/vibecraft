"""Stop hook — блокирует СБРОС технической/бэкенд-работы на Boris, которую я могу
сделать сам через CLI (vercel / supabase / gh / git / npx).

Класс ошибки (2026-07-17, Boris в ярости): вместо того чтобы самому задать env на
Vercel и проверить/поднять Supabase-проект, я написал «Тебе: задать ADMIN_EMAILS на
Vercel», «проверь в дашборде Supabase», «своими руками не дотянусь до Vercel/Supabase».
Ложь и лень: у меня есть vercel CLI, supabase CLI, gh, git. CLAUDE.md: «Использовать
инструменты, не просить вручную. Если можно через Edit/Write/Bash — делаю сам».

Правило: НЕ спихивать Boris'у инфру/бэкенд/конфиг (env на Vercel, Supabase-дашборд,
resume проекта, DNS, деплой, секреты). Делаю САМ через CLI, потом отчитываюсь. Просить
Boris руками — только если реально нет доступа (нет токена/CLI) И это указано.

Расширение (22.07, Boris в ярости повторно): тот же класс лени в другой обертке —
я САМ придумываю задачу, которую должен выполнить Boris («получить ID счетчика»,
«прислать доступ»), и кладу ее в очередь TodoWrite. Он такого не просил, а очередь
превращается в список поручений ему. Теперь проверяются оба места: текст ответа
и пункты очереди.

Логика: в финальном ответе есть маркер-сброс инфры на Boris И нет признака, что я
сделал это сам (CLI-вызов в ответе). Fail-open при ошибке.
"""
import json
import re
import sys
from pathlib import Path

# Я сбрасываю инфру/бэкенд-задачу на Boris.
OFFLOAD_RE = re.compile(
    r"(тебе\s*:\s*(задать|задай|проверь|настрой|зайд|откр|resume|обнови|добав|укаж|"
    r"пропиш|сдела|подним|резюмир)|"
    r"своими\s+руками\s+не\s+дотян|не\s+дотян\w*\s+до\s+(vercel|supabase|дашборд|vercel/)|"
    r"руками\s+не\s+достан|это\s+не\s+в\s+коде\s*[—–-]\s*(ты|сам|тво|руками)|"
    r"проверь\s+в\s+дашборд|зайди\s+(в|на)\s+(vercel|supabase|дашборд)|"
    r"задать?\s+на\s+vercel|env\s+на\s+vercel\s+(задай|задать|настрой|добав|указ)|"
    r"resume,?\s+если\s+на\s+паузе|\bunpause\b|подними\s+(проект|supabase)|"
    r"тебе\s+(нужно|надо|стоит)\s+(задать|настро|провер|зайти|обнови|добав|указа|"
    r"сдела|подня|резюмир|распис))",
    re.IGNORECASE | re.UNICODE)

# Признак, что я сделал это САМ через CLI (снимает блок).
DID_SELF_RE = re.compile(
    r"(vercel\s+env\s+(add|ls|pull|rm)|supabase\s+(projects|link|db|start|status)|"
    r"через\s+CLI|сам\s+(задал|поднял|проверил|сделал|настроил|добавил)|"
    r"\bgh\s+|npx\s+vercel|запустил\s+(vercel|supabase)|выполнил\s+(команд|vercel|supabase))",
    re.IGNORECASE | re.UNICODE)

# Пункт очереди, который на самом деле поручение Boris, а не моя работа.
TODO_OFFLOAD_RE = re.compile(
    r"(жду\s+(id|ключ|доступ|токен|логин|от\s+boris)|"
    r"получить\s+(id|ключ|доступ|токен|от\s+boris)|"
    r"нужен\s+(id|ключ|доступ|токен|логин)\s+от\s+boris|"
    r"попросить\s+boris|спросить\s+у\s+boris|"
    r"boris\s+(должен|пришлет|даст|создаст|заведет))",
    re.IGNORECASE | re.UNICODE)


def _last_todos(msgs):
    """Пункты последнего TodoWrite."""
    todos = None
    for m in msgs:
        if m.get("type") != "assistant":
            continue
        c = (m.get("message", {}) or {}).get("content")
        if not isinstance(c, list):
            continue
        for b in c:
            if (isinstance(b, dict) and b.get("type") == "tool_use"
                    and b.get("name") == "TodoWrite"):
                t = (b.get("input", {}) or {}).get("todos")
                if isinstance(t, list):
                    todos = t
    return todos or []


META_RE = re.compile(
    r"(хук|check_no_offload|класс\w*\s+ошибк|блокир\w*|\bловит\b|сбрасыва\w*\s+на\s+boris\b\s+запрещ)",
    re.IGNORECASE | re.UNICODE)


def _is_tool_result(m):
    c = m.get("message", {}).get("content", [])
    return isinstance(c, list) and bool(c) and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c)


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
    clean = re.sub(r"```[\s\S]*?```", "", resp)
    clean = re.sub(r"`[^`]*`", "", clean)
    clean = "\n".join(l for l in clean.splitlines() if not l.lstrip().startswith(">"))

    for t in _last_todos(msgs):
        if not isinstance(t, dict):
            continue
        if t.get("status") not in ("pending", "in_progress"):
            continue
        hit = TODO_OFFLOAD_RE.search(t.get("content") or "")
        if hit:
            print(json.dumps({"decision": "block", "reason": (
                f"НАРУШЕНИЕ check_no_offload_to_boris: в очереди висит пункт "
                f"«{(t.get('content') or '')[:60]}» — это поручение Boris, а не твоя "
                "работа. Ты сам придумал задачу и повесил ее на него, он такого не "
                "просил. Убери пункт из TodoWrite: недостающий факт просто назови в "
                "ответе одной строкой. Задачей это станет, когда Boris скажет."
            )}))
            sys.exit(0)

    m = OFFLOAD_RE.search(clean)
    if not m:
        sys.exit(0)
    if META_RE.search(clean) or DID_SELF_RE.search(clean):
        sys.exit(0)  # обсуждаю хук ИЛИ сделал сам через CLI
    print(json.dumps({"decision": "block", "reason": (
        f"НАРУШЕНИЕ check_no_offload_to_boris: ты сбрасываешь на Boris техработу "
        f"(«{m.group(0).strip()}») — инфру/бэкенд/конфиг, которую можешь сделать САМ "
        "через CLI (vercel env, supabase, gh, git, npx). Это лень и наеб. CLAUDE.md: "
        "используй инструменты, не проси вручную. СДЕЛАЙ САМ (задай env, проверь/подними "
        "проект, задеплой), потом отчитайся. Просить Boris руками — только если реально "
        "нет доступа (нет токена/CLI) и это прямо сказано."
    )}))
    sys.exit(0)


if __name__ == "__main__":
    main()

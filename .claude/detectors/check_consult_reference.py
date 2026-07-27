"""PreToolUse hook (ОБЩИЙ, не про SVG) — блокирует ЛЮБУЮ правку контента, пока
я не сверился с РЕАЛЬНЫМ референсом, на который указал Boris.

Класс ошибки (general, повторяется много дней, не важно копи/страница/мокап):
у меня под носом есть референс — реальный компонент, соседняя страница, скрин
от Boris — а я его НЕ читаю и выдумываю свою отсебятину. Правило: если Boris
позвал референс, СНАЧАЛА прочитай реальный референс-файл, потом правь.

Триггер = в недавних сообщениях Boris есть указание на референс (словами
«референс / с этого сайта / как в других страницах / консистентно / сверься /
как правильно выглядит / под носом» ИЛИ он прислал скрин-картинку).
Блок = после этого указания я НЕ сделал Read какого-либо реального файла-
референса (отличного от того, что правлю). Правки в самом .claude/ (хуки) не
трогаем — иначе нельзя чинить сам хук.
"""
import json
import re
import sys

REF_DEMAND_RE = re.compile(
    r"(референс|под\s+нос|с\s+этого\s+(?:же\s+)?сайт|как\s+на\s+сайт|"
    r"посмотри\s+как|погляди\s+как|как\s+(?:это\s+)?(?:выглядит|сделан|сделано|правильно)|"
    r"в\s+других\s+(?:стр|страниц|местах|мокап|файл)|консистентн|"
    r"сверя\w*|\bсверь\b|сверить|сверился|образец|эталон|"
    r"как\s+в\s+реальн|реальн\w*\s+(?:виджет|компонент|референс|юай|ui))",
    re.IGNORECASE | re.UNICODE,
)

SERVICE_MARKERS = (
    "Жесткие правила", "persisted-output", "hook additional context",
    "<local-command", "Caveat:", "<command-name>", "task-notification",
    "IMPORTANT: After completing",
)


def _user_text(o):
    if o.get("type") != "user" or o.get("isMeta"):
        return None
    c = (o.get("message", {}) or {}).get("content")
    has_img = False
    text = ""
    if isinstance(c, str):
        text = c
    elif isinstance(c, list):
        if any(isinstance(b, dict) and b.get("type") == "tool_result" for b in c):
            return None
        for b in c:
            # приложенная картинка ИЛИ документ (PDF/файл-образец) = референс-триггер
            if isinstance(b, dict) and b.get("type") in ("image", "document"):
                has_img = True
            elif isinstance(b, dict) and b.get("type") == "text":
                text += " " + b.get("text", "")
    text = re.sub(r"<system-reminder>.*?</system-reminder>", " ", text, flags=re.S)
    if any(m in text for m in SERVICE_MARKERS):
        text = ""
    return {"text": text, "img": has_img}


def _is_demand(o):
    u = _user_text(o)
    if u is None:
        return False
    if u["img"]:
        return True
    return bool(REF_DEMAND_RE.search(u["text"]))


def _bash_write_target(command: str) -> str:
    """Целевой файл записи в Bash-команде (перенаправление >/>>, tee, sed -i).

    Возвращает путь первого файла, в который команда ПИШЕТ контент, иначе "".
    /dev/*, картинки и явно временные пути не считаем контент-референсом.
    """
    if not command:
        return ""
    targets = []
    # > file  /  >> file  (не 2>&1, не &>)
    targets += re.findall(r"(?<![0-9&])>>?\s*\"?([^\s\"'>|&;]+)", command)
    # tee [-a] file
    targets += re.findall(r"\btee\b(?:\s+-a)?\s+\"?([^\s\"'>|&;]+)", command)
    # sed -i ... file (на месте)
    if re.search(r"\bsed\b[^|]*-i", command):
        targets += re.findall(r"\bsed\b[^|]*-i\S*\s+(?:[^|]*?\s)?\"?([^\s\"'>|&;]+\.[A-Za-z0-9]+)", command)
    for t in targets:
        t2 = t.replace("\\", "/").lower().strip()
        if not t2 or t2.startswith("/dev/"):
            continue
        if t2.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico")):
            continue  # картинки генерим, это не текст-референс
        return t2
    return ""


def _ps_write_target(command: str) -> str:
    """Целевой файл записи в PowerShell-команде — тот же обход, что Write/Bash.

    Ловит: перенаправление >/>>, Out-File, Set-Content/Add-Content,
    [IO.File]::WriteAll*, Export-Csv/Export-Clixml. Если команда не пишет
    контент в файл — "". $null/nul и картинки не считаем контент-референсом.
    """
    if not command:
        return ""
    targets = []
    # > file  /  >> file  (не 2>&1)
    targets += re.findall(r"(?<![0-9])>>?\s*[\"']?([^\s\"'>|&;]+)", command)
    # named -Path / -FilePath / -LiteralPath <file>  (Out-File, Set/Add-Content, Export-*)
    targets += re.findall(r"-(?:File|Literal)?Path\s+[\"']?([^\s\"'>|&;]+)",
                          command, re.IGNORECASE)
    # позиционный файл сразу после cmdlet: Out-File f / Set-Content f / Export-Csv f
    targets += re.findall(
        r"\b(?:Out-File|(?:Set|Add)-Content|Export-(?:Csv|Clixml))\s+[\"']?"
        r"([^-\s\"'>|&;][^\s\"'>|&;]*)",
        command, re.IGNORECASE)
    # [System.IO.File]::WriteAllText/Bytes/Lines("file", ...)
    targets += re.findall(r"WriteAll(?:Text|Bytes|Lines)\s*\(\s*[\"']?([^\"'\),]+)",
                          command, re.IGNORECASE)
    for t in targets:
        t2 = t.replace("\\", "/").lower().strip().strip("\"").strip("'")
        if not t2 or t2.startswith("-"):
            continue
        if t2 in ("$null", "nul", "/dev/null", "out-null"):
            continue
        if t2.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico")):
            continue  # картинки генерим, это не текст-референс
        return t2
    return ""


def _read_paths(o):
    """пути всех Read в assistant-сообщении."""
    out = []
    if o.get("type") != "assistant":
        return out
    c = (o.get("message", {}) or {}).get("content")
    if not isinstance(c, list):
        return out
    for b in c:
        if isinstance(b, dict) and b.get("type") == "tool_use" and b.get("name") == "Read":
            p = str((b.get("input", {}) or {}).get("file_path", "")).replace("\\", "/").lower()
            if p:
                out.append(p)
    return out


def decide():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "ignore")
        data = json.loads(raw or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse":
        return None
    tool = data.get("tool_name")
    if tool not in ("Edit", "Write", "MultiEdit", "Bash", "PowerShell"):
        return None
    ti = data.get("tool_input", {}) or {}
    if tool == "Bash":
        # Bash-запись файла (cat >file, echo >file, tee file, sed -i file) —
        # тот же обход, что Write. Если команда не пишет в файл — не гейтим.
        target = _bash_write_target(str(ti.get("command", "")))
        if not target:
            return None
    elif tool == "PowerShell":
        # PowerShell-запись файла (Out-File, Set-Content, WriteAllText, >file) —
        # тот же обход, что Write/Bash. Если команда не пишет в файл — не гейтим.
        target = _ps_write_target(str(ti.get("command", "")))
        if not target:
            return None
    else:
        target = str(ti.get("file_path", "")).replace("\\", "/").lower()
    if not target:
        return None
    if "/.claude/" in target or target.endswith(".claude"):
        return None  # правки самих хуков/конфига не гейтим
    tp = data.get("transcript_path")
    if not tp:
        return None
    try:
        with open(tp, encoding="utf-8") as f:
            lines = f.read().splitlines()
    except Exception:
        return None
    objs = []
    for line in lines:
        try:
            objs.append(json.loads(line))
        except Exception:
            objs.append(None)
    # индекс последнего указания на референс
    d = -1
    for i, o in enumerate(objs):
        if o and _is_demand(o):
            d = i
    if d == -1:
        return None  # Boris референс не звал — не гейтим
    # после указания — был ли Read реального файла-референса (не того, что правлю)?
    for o in objs[d + 1:]:
        if not o:
            continue
        for p in _read_paths(o):
            if p != target and "." in p.rsplit("/", 1)[-1]:
                return None  # референс прочитан
    return (
        "БЛОК check_consult_reference: Boris позвал сверяться с референсом "
        "(словами или скрином), а ты правишь контент, не прочитав реальный "
        "референс-файл. Это твой повторяющийся general-баг: выдумываешь свой "
        "вариант вместо копии того, что под носом. СТОП: сначала открой Read'ом "
        "РЕАЛЬНЫЙ референс (компонент/соседнюю страницу/источник, на который "
        "указал Boris), повтори его точь-в-точь, и только потом правь."
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

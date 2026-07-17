"""PreToolUse hook - ne trogat VIZUAL vslepuyu, bez vzglyada na strancu.

Put A (14.07): dobavil 4-yu kartochku v massiv advantages (setka iz 3), ne posmotrev
kak lyazhet v grid-cols-3. Kartochka vstala odna v novom ryadu - krivaya verstka
uehala v prod. Geytit Edit/Write v .tsx, kogda menyaetsya STRUKTURA raskladki.

Put B (17.07): zhaloba byla VIZUALNAYA - "na ekrane 2 odinakovye CTA-knopki". Ya, ne
posmotrev na str?nicu, reshil chto dubl - eto tekst-ssylki v TELE stati, i pravil
blog-posts.ts (.ts kontent, ne .tsx!). Realnyy dubl byl knopka-v-shapke + CTA-blok.
Promahnulsya vslepuyu, potratil vremya Boris. Put A geytit tolko .tsx+setka, poetomu
pravku .ts on ne uvidel. Boris: pochemu huk ne rabotaet na tvoy dolboebizm.

Put B: esli POSLEDNYAYA zhaloba Boris - pro to chto VIDNO na str?nice (knopka/dubl/
hover/kaver/ikonka/verstka), a ty pravish LYUBOY fayl (ne tolko .tsx) i posle etoy
zhaloby NI RAZU ne smotrel str?nicu cherez Playwright - blok. Snachala posmotri gde
realnyy istochnik, potom pravish.

Oba puti snimayutsya pometkoy v podvodke: "vizual: <kak posmotrel / plan proverki>".
Pravki samih hukov (.claude/) ne geytim.
"""
import json
import re
import sys

STRUCT_RE = re.compile(
    r"(grid-cols-|\{\s*icon:|col-span|columns|flex-wrap|min-w-\[|max-w-\[|"
    r"grid-template|<Advantage|advantages:\s*\[|grid-rows|basis-|"
    r"w-\[\d|justify-|items-stretch|aspect-\[|space-y-|gap-)",
    re.IGNORECASE,
)

VISUAL_EXEMPT_RE = re.compile(
    r"(vizual|визуал|playwright|скриншот|browser_|snapshot|"
    r"снапшот|верстк|как\s+ляжет|как\s+льётся|глазами|посмотрел\s+на\s+стран|"
    r"посмотрю\s+на\s+стран|проверю\s+визуал|открыл\s+стран)",
    re.IGNORECASE | re.UNICODE,
)

# Zhaloba Boris pro to chto VIDNO na str?nice.
VISUAL_COMPLAINT_RE = re.compile(
    r"(на\s+экране|ховер|hover|навед|"
    r"кавер|обложк|иконк|звезд|бейдж|badge|плашк|лого|"
    r"дубл\w*\s*(кнопк|cta|ста|блок|слов|бренд|заголов|текст|элемент|иконк)|"
    r"(две|двойн\w*|2)\s*(кнопк|cta|ста|блок)|"
    r"кнопк\w*.{0,14}(одинак|дубл|повтор|дважды|два\s+раза)|"
    r"одинаков\w*.{0,14}(кнопк|cta|ста|блок)|"
    r"съехал|уехал|наезжа|перекрыва|не\s+влезае|"
    r"выглядит|отобража|в\s+разных\s+местах|"
    r"пропал\w*.{0,16}(кавер|обложк|иконк|блок|кнопк|лого|заголов))",
    re.IGNORECASE | re.UNICODE,
)


def _last_assistant_text(lines):
    for line in reversed(lines):
        try:
            o = json.loads(line)
        except Exception:
            continue
        if o.get("type") != "assistant":
            continue
        content = (o.get("message", {}) or {}).get("content")
        if not isinstance(content, list):
            continue
        parts = [b.get("text", "") for b in content
                 if isinstance(b, dict) and b.get("type") == "text"]
        if parts:
            return "\n".join(parts)
    return ""


def _has_playwright_look(o):
    """assistant-soobshchenie s vyzovom lyubogo playwright browser_* instrumenta."""
    if not isinstance(o, dict) or o.get("type") != "assistant":
        return False
    content = (o.get("message", {}) or {}).get("content")
    if not isinstance(content, list):
        return False
    for b in content:
        if (isinstance(b, dict) and b.get("type") == "tool_use"
                and "browser_" in str(b.get("name", ""))):
            return True
    return False


def _user_speech(o):
    """Tekst realnoy repliki Boris (ne tool_result). Pustaya stroka esli ne user."""
    if not isinstance(o, dict) or o.get("type") != "user":
        return ""
    content = (o.get("message", {}) or {}).get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for b in content:
            if not isinstance(b, dict):
                continue
            if b.get("type") == "tool_result":
                return ""  # eto rezultat instrumenta, ne rech Boris
            if b.get("type") == "text":
                parts.append(b.get("text", ""))
        return "\n".join(parts)
    return ""


def _visual_complaint_unlooked(lines):
    """True esli posle poslednego vzglyada na str?nicu (playwright) prishla
    VIZUALNAYA zhaloba Boris, a novogo vzglyada s teh por ne bylo."""
    objs = []
    for line in lines[-600:]:
        try:
            objs.append(json.loads(line))
        except Exception:
            objs.append(None)
    last_look = -1
    for i, o in enumerate(objs):
        if _has_playwright_look(o):
            last_look = i
    for i in range(last_look + 1, len(objs)):
        txt = _user_speech(objs[i])
        if txt and VISUAL_COMPLAINT_RE.search(txt):
            return True
    return False


def decide():
    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "ignore")
        data = json.loads(raw or "{}")
    except Exception:
        return None
    if data.get("hook_event_name") != "PreToolUse":
        return None
    if data.get("tool_name") not in ("Edit", "Write", "MultiEdit"):
        return None
    ti = data.get("tool_input", {}) or {}
    fp = str(ti.get("file_path", "")).replace("\\", "/")
    if "/.claude/" in fp.lower():
        return None
    payload = (str(ti.get("new_string", "")) + "\n"
               + str(ti.get("old_string", "")) + "\n"
               + str(ti.get("content", "")))

    tp = data.get("transcript_path")
    lines = []
    lead = ""
    if tp:
        try:
            with open(tp, encoding="utf-8") as f:
                lines = f.read().splitlines()
            lead = _last_assistant_text(lines)
        except Exception:
            lines, lead = [], ""

    # Soznatelnaya pometka vizualnoy proverki snimaet oba puti.
    if VISUAL_EXEMPT_RE.search(lead):
        return None

    # Put B: pravka LYUBOGO fayla pod nerazobrannuyu vizualnuyu zhalobu.
    if lines and _visual_complaint_unlooked(lines):
        return (
            "БЛОК check_ui_visual (вслепую по визуалу): последняя жалоба Boris — про то, "
            "что ВИДНО на странице (кнопка/дубль/ховер/кавер/иконка/верстка), а ты правишь "
            "файл, НЕ посмотрев сначала на саму страницу. Класс ошибки 17.07: на жалобу «2 "
            "одинаковые CTA-кнопки на экране» ты убрал текст-ссылки в ТЕЛЕ статьи (.ts), а "
            "реальный дубль был кнопка в шапке + CTA-блок — промахнулся вслепую и потратил "
            "время Boris. СТОП: сначала ПОСМОТРИ живую страницу (mcp__playwright "
            "browser_navigate + browser_snapshot/evaluate/take_screenshot), найди РЕАЛЬНЫЙ "
            "источник того, что видит Boris, и только потом правь. Либо в подводке явно "
            "напиши 'визуал: <как посмотрел и что нашел>'."
        )

    # Put A: strukturnaya pravka .tsx bez vizualnoy proverki.
    if fp.lower().endswith(".tsx") and STRUCT_RE.search(payload):
        return (
            "BLOK check_ui_playwright: pravitsya STRUKTURA verstki (.tsx, setka/kartochki/"
            "kolonki), no v podvodke net pometki vizualnoy proverki. Klass oshibki - 4-ya "
            "kartochka odna v ryadu uehala v prod. ZAPRESHCHENO menyat raskladku vslepuyu. "
            "Snachala posmotri kak lyazhet cherez Playwright (browser_navigate + "
            "browser_take_screenshot) LIBO podtverdi plan: napishi v podvodke "
            "'vizual: <kak proveryu do deploya>' - tolko togda prav. Ne huyar setku na glaz."
        )
    return None


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

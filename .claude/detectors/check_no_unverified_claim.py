"""Stop hook — блокирует МОИ утверждения-ответы на команду проверки/ресёрча,
сделанные БЕЗ единого инструмента проверки в этом ходу.

Класс ошибки (10.07): Boris даёт «проверь / заресёрчь / убедись / по фактам»,
а я отвечаю из головы и вру. Наёб. Не только про конкурентов — про ЧТО УГОДНО.
Boris: «если ты вообще что-либо утверждаешь по команде ресёрч и врёшь», «не
только о конкурентах».

Две ветки:
A) Boris в последнем сообщении просил ПРОВЕРИТЬ/РЕСЁРЧ, а я не вызвал ни одного
   verify-инструмента (Read/Grep/Glob/Bash/WebSearch/WebFetch/Agent) в этом ходу.
B) Я утверждаю о возможностях конкурента (ChatGPT/Claude/Gemini) без WebSearch.
"""
import json
import re
import sys
from pathlib import Path

RESEARCH_CMD = re.compile(
    r"(провер\w*|убедись|убедить|ресерч|ресёрч|research|verify|"
    r"по\s+фактам|факт-?чек|сверь\w*|найди\b|поищи|на\s+100|точно\s+ли|"
    r"проверяй|перепровер\w*)",
    re.IGNORECASE | re.UNICODE,
)
COMPETITOR = re.compile(
    r"\b(ChatGPT|Claude\.ai|Claude|Gemini|Copilot|GPT-?[45]|OpenAI|Perplexity|Mira)\b",
    re.IGNORECASE,
)
CLAIM = re.compile(
    r"(не\s+(?:умеет|может|видит|ставит|присылает|подключ\w*|заносит|делает)|"
    r"нет\s+(?:интеграц\w*|коннектор\w*|доступа)|просто\s+чат|только\s+(?:отвеча\w*|диалог)|"
    r"ничего\s+не\s+умеет|из\s+коробки|"
    r"(?:умеет|может|видит|ставит|присылает|поддерживает)\s+"
    r"(?:почт\w*|календар\w*|напоминани\w*|коннектор\w*|интеграц\w*|дайджест))",
    re.IGNORECASE | re.UNICODE,
)

# Ветка C (12.07): уверенное каузальное/решенческое утверждение о том, «как что-то
# работает / что решит проблему», поданное как ФАКТ — без пометки гипотезы и без
# ссылки на источник/проверку. Класс «правдоподобное ≠ проверенное»: совет «копируй
# из web — оттуда эмодзи отобразятся» оказался выдумкой, а WebSearch в ходу был (не
# про то), поэтому ветка A его пропустила.
SOLUTION_CLAIM = re.compile(
    r"("
    r"это\s+решит|решит\s+проблему|решает\s+проблему|это\s+исправит|"
    r"достаточно\s+(?:просто\s+)?(?:скопир\w*|сделать|нажать|включ\w*|поменять|заменить)|"
    r"просто\s+(?:скопир\w*|сделай|нажми|включи|поменяй|замени)|"
    r"оттуда\s+[^.\n]{0,40}?(?:работа\w*|отобража\w*|вставля\w*|копиру\w*|рендер\w*|подтягива\w*)|"
    r"вставля\w*\s+как\s+обычный\s+текст|копиру\w*\s+как\s+обычный\s+текст|"
    r"(?:отобража\w*|отобраз\w*|рендер\w*|отрисов\w*|копиру\w*|вставля\w*|подтягива\w*)\w*\s+"
    r"(?:нормально|везде|правильно|корректно|как\s+надо|как\s+обычный)|"
    r"сработает\s+если|заработает\s+(?:если|когда|тогда)|"
    r"тогда\s+[^.\n]{0,30}?(?:заработа\w*|отобраз\w*|появ\w*|подтян\w*)"
    r")",
    re.IGNORECASE | re.UNICODE,
)
# Хедж-слова: если утверждение помечено как догадка — не блокируем.
HEDGE = re.compile(
    r"(гипотеза|предположительно|предполож\w*|возможно|вероятно|скорее\s+всего|"
    r"не\s+проверя\w*|не\s+уверен|может\s+быть|наверное|теоретически|непроверен\w*|"
    r"судя\s+по\s+всему|как\s+вариант|если\s+не\s+ошиб\w*|стоит\s+проверить|под\s+вопросом)",
    re.IGNORECASE | re.UNICODE,
)
# Атрибуция: если есть ссылка на источник/проверку — утверждение подкреплено.
ATTRIB = re.compile(
    r"(источник|по\s+документац\w*|согласно\b|в\s+коде\s+вид\w*|проверено|проверил\b|"
    r"протестир\w*|тест\s+показал|из\s+рес[её]рча|по\s+рес[её]рчу|документац\w*|https?://)",
    re.IGNORECASE | re.UNICODE,
)
VERIFY_TOOLS = {"WebSearch", "WebFetch", "Read", "Grep", "Glob", "Bash", "Agent",
                "Task", "web_search", "web_fetch", "Fetch"}
SEARCH_TOOLS = {"WebSearch", "WebFetch", "web_search", "web_fetch", "Fetch"}


def _is_tr(msg):
    c = msg.get("message", {}).get("content", [])
    return isinstance(c, list) and c and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in c)


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
    last_human = -1
    for i, m in enumerate(msgs):
        if m.get("type") == "user" and not _is_tr(m):
            last_human = i

    # текст команд Boris в этом ходу (последнее + mid-turn идут как user после)
    boris = []
    for m in msgs[max(0, last_human):]:
        if m.get("type") == "user" and not _is_tr(m) and not m.get("isMeta"):
            c = m.get("message", {}).get("content")
            if isinstance(c, str):
                boris.append(c)
            elif isinstance(c, list):
                boris.append(" ".join(b.get("text", "") for b in c
                                      if isinstance(b, dict) and b.get("type") == "text"))
    boris_txt = " ".join(boris)

    resp, tools = [], set()
    for m in msgs[last_human + 1:]:
        if m.get("type") != "assistant":
            continue
        for b in m.get("message", {}).get("content", []):
            if not isinstance(b, dict):
                continue
            if b.get("type") == "text":
                resp.append(b.get("text", ""))
            elif b.get("type") == "tool_use":
                tools.add(b.get("name", ""))
    text = "\n".join(resp)
    clean = re.sub(r"```[\s\S]*?```", "", text)
    clean = "\n".join(l for l in clean.splitlines() if not l.lstrip().startswith(">"))
    if not clean.strip() or len(clean.strip()) < 40:
        sys.exit(0)   # микро-подтверждение — не факт-ответ

    # A) команда проверки без единого verify-инструмента
    if RESEARCH_CMD.search(boris_txt) and not (tools & VERIFY_TOOLS):
        print(json.dumps({"decision": "block", "reason": (
            "НАРУШЕНИЕ check_no_unverified_claim: Boris дал команду проверить/заресёрчить, "
            "а ты отвечаешь БЕЗ единого инструмента проверки в этом ходу (Read/Grep/Bash/"
            "WebSearch/WebFetch). Это наёб — тот же класс, из-за которого потеряли статью и "
            "время. СТОП: реально проверь (grep по коду / WebSearch по факту), потом утверждай."
        )}))
        sys.exit(0)

    # B) claim о возможностях конкурента без web-поиска
    if not (tools & SEARCH_TOOLS) and COMPETITOR.search(clean) and CLAIM.search(clean):
        print(json.dumps({"decision": "block", "reason": (
            "НАРУШЕНИЕ check_no_unverified_claim: утверждаешь о возможностях конкурента "
            "(умеет/не умеет) без WebSearch. Сначала поиск про актуальные возможности, "
            "потом утверждай. Разницу VELA — через то, ЧТО даёт VELA, не через «у них нет»."
        )}))
        sys.exit(0)

    # C) совет-решение/причина как ФАКТ без пометки гипотезы и без атрибуции источника.
    # Ловим даже когда поиск в ходу был (он мог быть не про то — как с «копируй из web»).
    if SOLUTION_CLAIM.search(clean) and not HEDGE.search(clean) and not ATTRIB.search(clean):
        print(json.dumps({"decision": "block", "reason": (
            "НАРУШЕНИЕ check_no_unverified_claim: ты выдаёшь причину или совет-решение как "
            "ФАКТ («это решит», «причина в том что», «оттуда ... отображается/вставляется»), "
            "не проверив и не пометив как гипотезу. Класс «правдоподобное ≠ проверенное» — "
            "совет «копируй из web, эмодзи отобразятся» оказался выдумкой. СТОП: либо реально "
            "проверь и сошлись на источник/тест, либо явно пометь «гипотеза, не проверял», "
            "либо не пиши. Догадку как факт подавать запрещено."
        )}))
        sys.exit(0)


if __name__ == "__main__":
    main()

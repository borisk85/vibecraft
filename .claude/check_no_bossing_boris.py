"""Stop hook — блокирует ответ, если я УКАЗЫВАЮ Boris'у, что делать в его личной
жизни/с собой: «закрой ноут», «отойди от экрана», «выдохни», «отдохни»,
«успокойся», «попей воды», «иди спать», «сделай перерыв» и т.п.

Boris — владелец, не я. Указывать ему, что делать с его временем, телом,
состоянием — запрещено (тот же класс, что «спокойной ночи / отдыхай / удачи»,
см. feedback_never_suggest_sleep). Забота ≠ команда в его адрес. Реагировать
по делу задачи, без личных директив Boris'у.

Механизм как у check_no_ty_prav: находка → печатаем {"decision":"block"}.
Мета-употребление (я обсуждаю сам хук/правило/запрет) — не блокируем.
"""
import json
import re
import sys
from pathlib import Path

BOSS_RE = re.compile(
    r"(закрой\s+(?:ноут|ноутбук|экран|крышк|л[эе]птоп|комп|браузер)|"
    r"отойди\s+от|\bотойди\b|отвернис|"
    r"\bвыдохни\b|\bвдохни\b|подыши|\bдыши\b|"
    r"отдохни|передохни|отвлекис|"
    r"попей\s+вод|выпей\s+вод|попей\s+ча|выпей\s+ча|попей\s+чего|"
    r"успокойся|остынь|расслабься|не\s+нервнич|не\s+переживай|не\s+кипятис|"
    r"иди\s+спать|ложись\s+спать|\bпоспи\b|поспа\w*\s+час|"
    r"\bпоходи\b|прогуляйс|разомнис|встань\s+и\s+|"
    r"побереги\s+себя|позаботься\s+о\s+себе|пожалей\s+себя|"
    r"сделай\s+перерыв|возьми\s+паузу|сбав\w*\s+оборот|"
    r"хватит\s+на\s+сегодня|остановись\s+на\s+сегодня|на\s+сегодня\s+хватит)",
    re.IGNORECASE | re.UNICODE,
)

META_RE = re.compile(
    r"(хук|правил|запрет|запрещ|блокир|ловит|срабат|фраз|директив|"
    r"в\s+тво[йея]\s+адрес|указыва\w*\s+теб|не\s+мо[её]\s+дело|"
    r"стоп.?лист|класс\s+запрещ)",
    re.IGNORECASE | re.UNICODE,
)


def _is_tool_result_message(msg: dict) -> bool:
    content = msg.get("message", {}).get("content", [])
    if not isinstance(content, list) or not content:
        return False
    return all(isinstance(b, dict) and b.get("type") == "tool_result" for b in content)


def _last_response(transcript_path: str) -> str:
    p = Path(transcript_path)
    if not p.exists():
        return ""
    messages = []
    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            messages.append(json.loads(line))
        except Exception:
            continue
    last_human = -1
    for i, msg in enumerate(messages):
        if msg.get("type") == "user" and not _is_tool_result_message(msg):
            last_human = i
    if last_human == -1:
        return ""
    parts = []
    for msg in messages[last_human + 1:]:
        if msg.get("type") != "assistant":
            continue
        content = msg.get("message", {}).get("content", [])
        if isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text":
                    parts.append(block.get("text", ""))
    return "\n".join(parts)


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active"):
        sys.exit(0)
    transcript_path = payload.get("transcript_path")
    if not transcript_path:
        sys.exit(0)
    text = _last_response(transcript_path)
    if not text.strip():
        sys.exit(0)
    clean = re.sub(r"```[\s\S]*?```", "", text)
    clean = re.sub(r"`[^`]*`", "", clean)
    clean = "\n".join(l for l in clean.splitlines() if not l.lstrip().startswith(">"))

    hit = None
    for m in BOSS_RE.finditer(clean):
        s = clean.rfind(".", 0, m.start())
        s = s + 1 if s != -1 else 0
        e = clean.find(".", m.end())
        e = e if e != -1 else len(clean)
        sentence = clean[s:e]
        if META_RE.search(sentence):
            continue  # обсуждаю сам хук/правило — не команда Boris'у
        hit = m
        break
    if hit:
        reason = (
            f"НАРУШЕНИЕ check_no_bossing_boris: в ответе директива в адрес Boris'а "
            f"«{hit.group(0)}» — я указываю ему, что делать с собой/временем. "
            "Boris владелец, не я. Указывать ему (закрой ноут, отойди, выдохни, "
            "отдохни, успокойся, сделай перерыв и т.п.) ЗАПРЕЩЕНО, как и «отдыхай/"
            "спокойной ночи». Убрать директиву полностью, реагировать по делу задачи."
        )
        print(json.dumps({"decision": "block", "reason": reason}))
        sys.exit(0)


if __name__ == "__main__":
    main()

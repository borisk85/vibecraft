"""Stop hook — блокирует РЕГРЕССИОННЫЙ совет: любую мою рекомендацию, которая
двигает прогресс Boris НАЗАД. Не про блог/статьи конкретно — про ЛЮБУЮ тему.

Класс ошибки (2026-07-17): (1) предложил писать 2 обзора «чтобы наполнить пустую
категорию», хотя ключей и частоты под них нет; (2) предложил переформулировать тему,
собранную под конкретные ключи. Оба совета — регресс: действие ради структуры/
симметрии/полноты, а не ради данных и цели. Boris: советы регрессионного характера
НЕ должны появляться в чате — неважно, блог это, статья или что угодно.

Сигнатура регресса (мехпроверка): совет обоснован «чтобы наполнить / для баланса /
ради симметрии / чтобы не пустовало / для полноты», ИЛИ оживляет уже отброшенное
(«вернуть обратно / из старого файла / восстановить удалённое / откатить»), ИЛИ
разворачивает решение, принятое на данных («переформулировать тему / подогнать под
категорию»). Если рядом НЕТ привязки к данным/цели/метрике — это регресс.

Логика: в финальном ответе есть маркер регресса (REG) И нет опоры на данные/цель
(EVID) И это не отказ (NEG) → блок. Fail-open при любой ошибке.
"""
import json
import re
import sys
from pathlib import Path

# Сигнатура регресса: обоснование симметрией/полнотой, оживление старого, разворот.
REG_RE = re.compile(
    r"(чтобы\s+наполн\w*|для\s+баланс\w*|ради\s+симметри\w*|для\s+симметри\w*|"
    r"чтобы\s+не\s+пустова\w*|чтобы\s+не\s+был\w*\s+пуст\w*|для\s+полноты|"
    r"для\s+равномерн\w*|чтобы\s+было\s+ровно|для\s+галочки|ради\s+галочки|"
    r"наполн\w*\s+(?:категори|раздел|пуст\w*|блог)|чтобы\s+закрыть\s+(?:раздел|категори)|"
    r"верн\w*\s+(?:обратно|назад|в\s+очередь|как\s+было|стар\w*)|"
    r"восстанов\w*\s+(?:стар|удал|убра|отброш)|оживить\s+стар\w*|"
    r"из\s+старого\s+(?:файл\w*|план\w*|список\w*|списка)|добав\w*\s+обратно|"
    r"откат\w*\s+(?:к|на|изменен|решени)|"
    r"переформул\w*|перепис\w*\s+(?:тему|под\s+категори|заголов\w*\s+под)|"
    r"подогна\w*\s+под|подстро\w*\s+под\s+(?:категори|раздел|структур))",
    re.IGNORECASE | re.UNICODE)

# Опора на данные/цель/метрику — снимает подозрение в регрессе.
EVID_RE = re.compile(
    r"(\d[\d\s.,]*\s*(?:/\s*мес|в\s+мес\b|запрос\w*|показ\w*|%)|"
    r"частот\w*|wordstat|вордстат|\bgkp\b|google\s+keyword|"
    r"спрос\D{0,8}\d|ключ\w*\D{0,8}\d|данн\w*|метрик\w*|конверси\w*|"
    r"цел\w*\s+(?:бизнес\w*|проекта|клиента|трафик)|по\s+данным|исход\w*\s+из\s+данн)",
    re.IGNORECASE | re.UNICODE)

# Отказ/отрицание — это НЕ позитивный регрессивный совет.
NEG_RE = re.compile(
    r"(\bне\b|\bнельзя\b|\bнет\b|не\s+совет\w*|не\s+надо|не\s+стоит|не\s+бер\w*|"
    r"не\s+пиш\w*|убра\w*|убер\w*|отказ\w*|против\s+этого|это\s+ошибк\w*|"
    r"это\s+регресс|\bлаж\w*)",
    re.IGNORECASE | re.UNICODE)

META_RE = re.compile(
    r"(хук|check_no_regress|класс\w*\s+ошибк|блокир\w*|\bловит\b|"
    r"правил\w*\s+запрещ|сигнатур\w*\s+регресс)",
    re.IGNORECASE | re.UNICODE)


def _is_tool_result(m: dict) -> bool:
    c = m.get("message", {}).get("content", [])
    return isinstance(c, list) and bool(c) and all(
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
    has_evid = bool(EVID_RE.search(clean))

    for m in REG_RE.finditer(clean):
        ls = clean.rfind("\n", 0, m.start()) + 1
        le = clean.find("\n", m.end())
        if le == -1:
            le = len(clean)
        sentence = clean[ls:le]
        if META_RE.search(sentence):
            continue  # обсуждаю сам хук/правило
        if NEG_RE.search(sentence):
            continue  # это отказ/отрицание, а не позитивный совет
        if has_evid:
            continue  # совет опирается на данные/цель — не регресс
        print(json.dumps({"decision": "block", "reason": (
            "НАРУШЕНИЕ check_no_regressive_advice: ты даёшь совет регрессионного "
            f"характера («{m.group(0).strip()}») — действие ради симметрии/полноты/"
            "оживления старого, а не ради данных и цели. Класс ошибки 17.07 (писать "
            "обзоры «чтобы наполнить категорию», переформулировать тему под данными). "
            "ЗАПРЕЩЕНО подавать Boris советы, двигающие прогресс назад. Либо привяжи "
            "совет к данным/цели/метрике (цифры спроса, цель бизнеса), либо не давай "
            "его — пустое/незаполненное лучше движения назад. Убери регрессивный совет."
        )}))
        sys.exit(0)
    sys.exit(0)


if __name__ == "__main__":
    main()

"""Stop hook — блокирует РЕКОМЕНДАЦИЮ по итогам ресерча БЕЗ проверки деталей.

Класс ошибки (общий, повторяется): я нахожу что-то через поиск/ресерч и советую
это делать/использовать/выбрать, НЕ проверив ключевые детали — цену, тариф,
требования, ограничения, применимость, подводные камни. Правдоподобная
рекомендация выдана за проверенную.

Примеры класса:
  - profit.kz — советовал как приоритет, не проверив, что нужен юрлицо;
  - РунетЭксперт — не проверил возраст домена (новодел, вес ~0);
  - CapCut — советовал как бесплатный, оказался платным (20 мин Boris впустую);
  - MailKit — «конкурентов нет» без проверки.

Правило: любую рекомендацию действовать (инструмент/сервис/площадку/подход) по
итогам ресерча выдавать ТОЛЬКО после проверки её ключевых деталей, и вывод
проверки писать явно. Иначе — сначала проверить.

Логика: есть уверенная рекомендация действовать, но НЕТ признаков, что детали
проверены (цена/тариф/требования/ограничения/условия/подводные камни/применимость)
и НЕТ честной оговорки «детали не проверял» — блок. Обсуждение самого хука
(«ёлочки») пропускаем.
"""
import json
import re
import sys
from pathlib import Path

# Уверенная рекомендация действовать по итогам ресерча.
REC_RE = re.compile(
    r"("
    r"\bрекомендую\b|\bсоветую\b|я\s+бы\s+(?:взял|выбрал|советовал|порекоменд)|"
    r"стоит\s+(?:использовать|взять|выбрать|подать|сделать|размест|завест|попроб)|"
    r"лучший\s+(?:вариант|выбор|инструмент)|оптимальн\w*\s+(?:вариант|выбор)|"
    r"\bбери\b|\bвыбирай\b|\bиспользуй\b|подойд[её]т\b|\bподходит\b|"
    r"\bприоритет\b|точно\s+(?:нужн|полезн|стоит|подойд)|"
    r"обязательно\s+(?:возьми|используй|подать|размест)|\bделать:\s|"
    r"максимально\s+релевантн|идеально\s+подход"
    r")",
    re.IGNORECASE | re.UNICODE,
)

# Признаки, что детали реально проверены/учтены (или честная оговорка).
VET_RE = re.compile(
    r"(цен[аеуы]\b|стоимост\w*|\$\d|\bот\s+\$|бесплатн\w*|платн\w*|тариф\w*|"
    r"требовани\w*|ограничени\w*|\bлимит\w*|услови\w*|подводн\w*|нюанс\w*|"
    r"\btrial\b|freemium|подписк\w*|\bпробн\w*|"
    r"проверил\w*|провер[ие]\w*|уточнить\s+надо|надо\s+(?:проверить|уточнить)|"
    r"детал\w*\s+не\s+(?:провер|смотрел)|не\s+проверял\w*|"
    r"dofollow|nofollow|юрлиц\w*|\bТОО\b|\bИП\b|физ\.?\s?адрес|"
    r"возраст\s+домен|зарегистрир\w*\s+\d|членств\w*|"
    r"самостоятельн\w*\s+добавлен|self-?serve)",
    re.IGNORECASE | re.UNICODE,
)


def _is_tool_result_message(msg: dict) -> bool:
    content = msg.get("message", {}).get("content", [])
    if not isinstance(content, list) or not content:
        return False
    return all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in content
    )


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
            for b in content:
                if isinstance(b, dict) and b.get("type") == "text":
                    parts.append(b.get("text", ""))
    return "\n".join(parts)


def _violates(text: str) -> bool:
    clean = text.strip()
    if not clean:
        return False
    m = REC_RE.search(clean)
    if not m:
        return False
    ls = clean.rfind("\n", 0, m.start()) + 1
    le = clean.find("\n", m.end())
    if le == -1:
        le = len(clean)
    line = clean[ls:le]
    if "«" in line and "»" in line:
        return False
    if "check_no_unvetted_fit" in clean and "хук" in line.lower():
        return False
    if VET_RE.search(clean):
        return False
    return True


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
    if _violates(text):
        reason = (
            "НАРУШЕНИЕ check_no_unvetted_fit: ты рекомендуешь что-то по итогам "
            "ресерча, не проверив ДЕТАЛИ — цену/тариф, требования, ограничения, "
            "применимость, подводные камни. Класс: profit.kz, РунетЭксперт, "
            "CapCut-платный, «конкурентов нет» — правдоподобное выдано за "
            "проверенное. СТОП: проверь ключевые детали и напиши вывод проверки "
            "ПЕРЕД советом, либо честно оговори «детали не проверял»."
        )
        print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == "__main__":
    main()

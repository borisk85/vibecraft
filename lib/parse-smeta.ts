// Парсер ответа калькулятора в структурированную смету.
// Используется в PDF-шаблоне и email-шаблоне калькулятора.

export interface ParsedSmeta {
  service: string;
  price: string;
  duration: string;
  included: string[];
  note: string;
  parsed: boolean;
}

export function parseSmeta(text: string): ParsedSmeta {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  let service = "";
  let price = "";
  let duration = "";
  let note = "";
  const included: string[] = [];
  let mode: "none" | "included" = "none";

  for (const line of lines) {
    if (line.startsWith("УСЛУГА:")) {
      service = line.slice("УСЛУГА:".length).trim();
      mode = "none";
    } else if (line.startsWith("ЦЕНА:")) {
      price = line.slice("ЦЕНА:".length).trim();
      mode = "none";
    } else if (line.startsWith("СРОК:")) {
      duration = line.slice("СРОК:".length).trim();
      mode = "none";
    } else if (line.startsWith("ЧТО ВХОДИТ:")) {
      mode = "included";
    } else if (line.startsWith("ПРИМЕЧАНИЕ:")) {
      note = line.slice("ПРИМЕЧАНИЕ:".length).trim();
      mode = "none";
    } else if (
      mode === "included" &&
      (line.startsWith("—") || line.startsWith("-"))
    ) {
      included.push(line.replace(/^[—-]\s*/, ""));
    }
  }

  const parsed = Boolean(
    service && price && duration && included.length > 0,
  );
  return { service, price, duration, included, note, parsed };
}

export function isSupportService(service: string): boolean {
  return service.toLowerCase().includes("поддержк");
}

export const SUPPORT_PLANS: { name: string; price: string }[] = [
  { name: "Разово, по часу", price: "25 000 ₸/час" },
  { name: "Пакет — 5 часов в месяц", price: "90 000 ₸" },
  { name: "Пакет — 15 часов в месяц", price: "240 000 ₸" },
];

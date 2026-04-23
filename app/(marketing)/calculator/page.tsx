import type { Metadata } from "next";
import { CalculatorClient } from "./CalculatorClient";

export const metadata: Metadata = {
  title: "Калькулятор стоимости проекта",
  description:
    "Опишите задачу обычным текстом — AI-калькулятор Vibecraft прикинет стоимость и срок проекта за минуту. Без созвона и опросников.",
  alternates: { canonical: "/calculator" },
  openGraph: {
    title: "Калькулятор стоимости проекта — Vibecraft",
    description:
      "Опишите задачу обычным текстом — AI прикинет стоимость и срок за минуту.",
    url: "/calculator",
    type: "website",
  },
};

export default function CalculatorPage() {
  return <CalculatorClient />;
}

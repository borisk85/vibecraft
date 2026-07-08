import type { Metadata } from "next";
import { CalculatorClient } from "./CalculatorClient";

export const metadata: Metadata = {
  title: "Калькулятор стоимости проекта",
  description:
    "Опишите задачу обычным текстом — ИИ-калькулятор Vibecraft прикинет стоимость и срок проекта за минуту.",
  alternates: { canonical: "/calculator" },
  openGraph: {
    title: "Калькулятор стоимости проекта — Vibecraft",
    description:
      "Опишите задачу обычным текстом — AI прикинет стоимость и срок за минуту.",
    images: ["/og-image.png"],
    url: "/calculator",
    type: "website",
  },
};

export default function CalculatorPage() {
  return <CalculatorClient />;
}

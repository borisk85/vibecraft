import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  renderToBuffer,
  type DocumentProps,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";

// Шрифт Inter v4.1 (rsms.me/inter), извлечен из официального GitHub release.
// Полная поддержка кириллицы И символа ₸ (тенге). Файлы в /public/fonts/.
// На Vercel serverless process.cwd() не имеет доступа к public/, поэтому
// загружаем через HTTP с самого сайта (CDN кеширует).
const FONT_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibecraft.kz";

Font.register({
  family: "Inter",
  fonts: [
    { src: `${FONT_BASE}/fonts/Inter-Regular.ttf`, fontWeight: "normal" },
    { src: `${FONT_BASE}/fonts/Inter-Bold.ttf`, fontWeight: "bold" },
  ],
});

const COLORS = {
  bg: "#FFFFFF",
  text: "#0A0A0A",
  textMuted: "#5A5A5A",
  textSubtle: "#888888",
  border: "#E5E5E5",
  borderLight: "#F0F0F0",
  accent: "#8B5CF6",
  accentBg: "#F5F0FF",
  cardBg: "#FAFAFA",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingLeft: 42,
    paddingRight: 42,
    fontFamily: "Inter",
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderBottomStyle: "solid",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    width: 44,
    height: 44,
    marginRight: 12,
  },
  logoBlock: {
    flexDirection: "column",
  },
  logoText: {
    fontSize: 19,
    fontWeight: "bold",
    color: COLORS.text,
    letterSpacing: -0.3,
    lineHeight: 1.1,
  },
  logoSubtext: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  dateText: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 22,
    lineHeight: 1.5,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.accent,
    marginBottom: 6,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  taskBlock: {
    backgroundColor: COLORS.cardBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "solid",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  taskText: {
    fontSize: 10.5,
    color: COLORS.text,
    lineHeight: 1.5,
  },
  // Структурированная смета
  smetaCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "solid",
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  smetaRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  smetaCol: {
    flexDirection: "column",
    width: "50%",
    paddingRight: 12,
  },
  miniLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: COLORS.textSubtle,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  serviceValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.accent,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.text,
  },
  durationValue: {
    fontSize: 13,
    color: COLORS.text,
  },
  includedSection: {
    marginTop: 2,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    borderTopStyle: "solid",
  },
  includedItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet: {
    fontSize: 10.5,
    color: COLORS.accent,
    marginRight: 6,
    width: 8,
  },
  includedText: {
    fontSize: 10.5,
    color: COLORS.text,
    flexGrow: 1,
    flexShrink: 1,
    lineHeight: 1.45,
  },
  note: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    borderTopStyle: "solid",
    lineHeight: 1.4,
  },
  // Fallback для не-стандартных ответов AI (отказ, уточнение)
  fallbackBlock: {
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "solid",
  },
  fallbackText: {
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 1.6,
  },
  // CTA
  ctaBox: {
    backgroundColor: COLORS.accentBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  ctaText: {
    fontSize: 10.5,
    color: COLORS.text,
    lineHeight: 1.45,
  },
  ctaBold: {
    fontWeight: "bold",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderTopStyle: "solid",
  },
  footerBrand: {
    fontSize: 10,
    color: COLORS.text,
    marginBottom: 6,
  },
  footerBrandBold: {
    fontWeight: "bold",
  },
  footerContacts: {
    fontSize: 9,
    color: COLORS.textMuted,
    lineHeight: 1.5,
  },
  footerLink: {
    color: COLORS.accent,
    fontWeight: "bold",
  },
});

function formatDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  return `${day} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

interface ParsedSmeta {
  service: string;
  price: string;
  duration: string;
  included: string[];
  note: string;
  parsed: boolean;
}

function parseSmeta(text: string): ParsedSmeta {
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
    } else if (mode === "included" && (line.startsWith("—") || line.startsWith("-"))) {
      included.push(line.replace(/^[—-]\s*/, ""));
    }
  }

  const parsed = Boolean(service && price && duration && included.length > 0);
  return { service, price, duration, included, note, parsed };
}

export interface CalculatorPdfProps {
  description: string;
  smeta: string;
}

export async function generateCalculatorPdfBuffer(
  props: CalculatorPdfProps,
): Promise<Buffer> {
  const element = CalculatorPdf(props) as ReactElement<DocumentProps>;
  return renderToBuffer(element);
}

export function CalculatorPdf({ description, smeta }: CalculatorPdfProps) {
  const parsed = parseSmeta(smeta);

  return (
    <Document
      title="Смета по проекту — Vibecraft"
      author="Vibecraft"
      subject="Ориентировочная смета"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src={`${FONT_BASE}/icon`} style={styles.logoImage} />
            <View style={styles.logoBlock}>
              <Text style={styles.logoText}>vibecraft</Text>
              <Text style={styles.logoSubtext}>
                AI-разработка и автоматизации · Казахстан
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>{formatDate()}</Text>
        </View>

        {/* Title + Subtitle */}
        <Text style={styles.title}>Ваша смета по проекту</Text>
        <Text style={styles.subtitle}>
          Спасибо что воспользовались калькулятором на сайте Vibecraft. Ниже —
          ориентировочный расчет стоимости вашей задачи.
        </Text>

        {/* Описание задачи */}
        <Text style={styles.sectionLabel}>Описание задачи</Text>
        <View style={styles.taskBlock}>
          <Text style={styles.taskText}>{description}</Text>
        </View>

        {/* Расчет — структурированный или fallback */}
        <Text style={styles.sectionLabel}>Расчет</Text>
        {parsed ? (
          <View style={styles.smetaCard}>
            <View style={styles.smetaRow}>
              <View style={styles.smetaCol}>
                <Text style={styles.miniLabel}>Услуга</Text>
                <Text style={styles.serviceValue}>{parsed.service}</Text>
              </View>
            </View>

            <View style={styles.smetaRow}>
              <View style={styles.smetaCol}>
                <Text style={styles.miniLabel}>Цена</Text>
                <Text style={styles.priceValue}>{parsed.price}</Text>
              </View>
              <View style={styles.smetaCol}>
                <Text style={styles.miniLabel}>Срок</Text>
                <Text style={styles.durationValue}>{parsed.duration}</Text>
              </View>
            </View>

            <View style={styles.includedSection}>
              <Text style={styles.miniLabel}>Что входит</Text>
              {parsed.included.map((item, i) => (
                <View key={i} style={styles.includedItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.includedText}>{item}</Text>
                </View>
              ))}
            </View>

            {parsed.note ? <Text style={styles.note}>{parsed.note}</Text> : null}
          </View>
        ) : (
          <View style={styles.fallbackBlock}>
            <Text style={styles.fallbackText}>{smeta}</Text>
          </View>
        )}

        {/* CTA */}
        <View style={styles.ctaBox}>
          <Text style={styles.ctaText}>
            <Text style={styles.ctaBold}>Готовы обсудить?</Text> Напишите мне в
            Telegram на @borisk85 — отвечу в течении 1-2 часа в рабочее время.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>
            <Text style={styles.footerBrandBold}>Vibecraft</Text> —
            AI-разработка и автоматизации · Казахстан
          </Text>
          <Text style={styles.footerContacts}>
            Telegram:{" "}
            <Text style={styles.footerLink}>@borisk85</Text>
            {"   ·   "}
            Email: hello@vibecraft.kz
            {"   ·   "}
            Сайт: <Text style={styles.footerLink}>vibecraft.kz</Text>
          </Text>
        </View>
      </Page>
    </Document>
  );
}

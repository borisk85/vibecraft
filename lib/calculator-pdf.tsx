import {
  Document,
  Page,
  Text,
  View,
  Svg,
  Path,
  StyleSheet,
  Font,
  renderToBuffer,
  type DocumentProps,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { V_PATH } from "./logo-path";
import {
  parseSmeta,
  isSupportService,
  SUPPORT_PLANS,
} from "./parse-smeta";

// Шрифт Roboto (googlefonts/roboto) — полная кириллица, стабильно работает
// в @react-pdf: корректные glyph-metrics и ToUnicode cmap, текст копируется
// без искажений. Inter v4 имел баг — при больших PDF extraction ломался.
// На Vercel serverless process.cwd() не имеет доступа к public/, поэтому
// загружаем через HTTP с самого сайта (CDN кеширует).
const FONT_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibecraft.kz";

Font.register({
  family: "Roboto",
  fonts: [
    { src: `${FONT_BASE}/fonts/Roboto-Regular.ttf`, fontWeight: "normal" },
    { src: `${FONT_BASE}/fonts/Roboto-Bold.ttf`, fontWeight: "bold" },
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
    paddingTop: 34,
    paddingBottom: 34,
    paddingLeft: 42,
    paddingRight: 42,
    fontFamily: "Roboto",
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderBottomStyle: "solid",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoSvg: {
    width: 32,
    height: 32,
    marginRight: 10,
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
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
    lineHeight: 1.15,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 16,
    lineHeight: 1.45,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.accent,
    marginBottom: 5,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  taskBlock: {
    backgroundColor: COLORS.cardBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "solid",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  taskText: {
    fontSize: 10,
    color: COLORS.text,
    lineHeight: 1.45,
  },
  // Структурированная смета
  smetaCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "solid",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  smetaRow: {
    flexDirection: "row",
    marginBottom: 10,
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
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.accent,
  },
  priceValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
  },
  durationValue: {
    fontSize: 12,
    color: COLORS.text,
  },
  includedSection: {
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    borderTopStyle: "solid",
  },
  includedItem: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bullet: {
    fontSize: 10,
    color: COLORS.accent,
    marginRight: 6,
    width: 8,
  },
  includedText: {
    fontSize: 10,
    color: COLORS.text,
    flexGrow: 1,
    flexShrink: 1,
    lineHeight: 1.4,
  },
  note: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 8,
    paddingTop: 6,
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
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  ctaText: {
    fontSize: 10,
    color: COLORS.text,
    lineHeight: 1.4,
  },
  ctaBold: {
    fontWeight: "bold",
  },
  // Footer
  footer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderTopStyle: "solid",
  },
  footerBrand: {
    fontSize: 10,
    color: COLORS.text,
    marginBottom: 4,
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
  // Блок «Форматы поддержки» — таблица 3 пакетов вместо цены-простыни
  supportPlans: {
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    borderTopStyle: "solid",
  },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    borderBottomStyle: "solid",
  },
  supportRowLast: {
    borderBottomWidth: 0,
  },
  supportPlanName: {
    fontSize: 10,
    color: COLORS.text,
    flexGrow: 1,
    flexShrink: 1,
  },
  supportPlanPrice: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.text,
  },
  // Невидимый прогон всего алфавита — заставляет @react-pdf subsetter
  // зарегистрировать ToUnicode-mapping для всех букв. Без этого некоторые
  // буквы (p, y и др.) могут отсутствовать в ToUnicode cmap, и
  // copy-paste / pdftotext будет терять символы.
  hiddenGlyphProbe: {
    position: "absolute",
    top: -1000,
    left: -1000,
    color: "#FFFFFF",
    fontSize: 1,
    opacity: 0,
  },
});

const GLYPH_PROBE =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "абвгдежзийклмнопрстуфхцчшщъыьэюяАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ" +
  "0123456789 .,:;!?()[]{}+-=/\\*&@#$%_<>'\"" +
  "—–·•₸№«»→←↑↓✓";

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
  const normalizedDescription = description.normalize("NFC");
  const parsed = parseSmeta(smeta.normalize("NFC"));
  const isSupport = isSupportService(parsed.service);

  return (
    <Document
      title="Смета по проекту — Vibecraft"
      author="Vibecraft"
      subject="Ориентировочная смета"
    >
      <Page size="A4" style={styles.page}>
        {/* Glyph probe: регистрирует весь алфавит в ToUnicode cmap */}
        <Text style={styles.hiddenGlyphProbe} fixed>
          {GLYPH_PROBE}
        </Text>
        <Text style={[styles.hiddenGlyphProbe, { fontWeight: "bold" }]} fixed>
          {GLYPH_PROBE}
        </Text>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Svg viewBox="0 0 1024 1024" style={styles.logoSvg}>
              <Path d={V_PATH} fill={COLORS.text} />
            </Svg>
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
          Спасибо, что воспользовались калькулятором на сайте Vibecraft. Ниже —
          ориентировочный расчет стоимости вашей задачи.
        </Text>

        {/* Описание задачи */}
        <Text style={styles.sectionLabel}>Описание задачи</Text>
        <View style={styles.taskBlock}>
          <Text style={styles.taskText}>{normalizedDescription}</Text>
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

            {isSupport ? (
              <View style={styles.smetaRow}>
                <View style={styles.smetaCol}>
                  <Text style={styles.miniLabel}>Срок</Text>
                  <Text style={styles.durationValue}>{parsed.duration}</Text>
                </View>
              </View>
            ) : (
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
            )}

            {isSupport ? (
              <View style={styles.supportPlans}>
                <Text style={styles.miniLabel}>Форматы поддержки</Text>
                {SUPPORT_PLANS.map((plan, i) => (
                  <View
                    key={plan.name}
                    style={[
                      styles.supportRow,
                      i === SUPPORT_PLANS.length - 1
                        ? styles.supportRowLast
                        : {},
                    ]}
                  >
                    <Text style={styles.supportPlanName}>{plan.name}</Text>
                    <Text style={styles.supportPlanPrice}>{plan.price}</Text>
                  </View>
                ))}
              </View>
            ) : null}

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
        <View style={styles.ctaBox} wrap={false}>
          <Text style={styles.ctaText}>
            <Text style={styles.ctaBold}>Готовы обсудить?</Text> Напишите мне в
            Telegram @borisk85 — отвечу в течение 1-2 часов в рабочее время.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} wrap={false}>
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

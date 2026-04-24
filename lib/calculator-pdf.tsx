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
// Полная поддержка кириллицы И символа ₸ (тенге) — ранее PT Sans не имел ₸,
// в PDF цена показывалась как «от 300 000 , до 400 000 ,» (mojibake).
const FONT_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibecraft.kz";

Font.register({
  family: "Inter",
  fonts: [
    {
      src: `${FONT_BASE}/fonts/Inter-Regular.ttf`,
      fontWeight: "normal",
    },
    {
      src: `${FONT_BASE}/fonts/Inter-Bold.ttf`,
      fontWeight: "bold",
    },
  ],
});

const COLORS = {
  bg: "#FFFFFF",
  text: "#0A0A0A",
  textMuted: "#5A5A5A",
  border: "#E5E5E5",
  accent: "#8B5CF6",
  accentBg: "#F5F0FF",
};

const styles = StyleSheet.create({
  page: {
    padding: 48,
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
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderBottomStyle: "solid",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  logoBlock: {
    flexDirection: "column",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  logoSubtext: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dateText: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 28,
    lineHeight: 1.6,
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
    backgroundColor: "#FAFAFA",
    padding: 14,
    borderRadius: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "solid",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  taskText: {
    fontSize: 10,
    color: COLORS.text,
    lineHeight: 1.5,
  },
  smetaBlock: {
    marginBottom: 24,
  },
  smetaText: {
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 1.6,
  },
  highlightBox: {
    backgroundColor: COLORS.accentBg,
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
    marginBottom: 24,
  },
  highlightText: {
    fontSize: 10,
    color: COLORS.text,
    lineHeight: 1.5,
  },
  highlightBold: {
    fontWeight: "bold",
    color: COLORS.text,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    paddingTop: 16,
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
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
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
  return (
    <Document
      title="Смета по проекту — Vibecraft"
      author="Vibecraft"
      subject="Ориентировочная смета"
    >
      <Page size="A4" style={styles.page}>
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

        <Text style={styles.title}>Ваша смета по проекту</Text>
        <Text style={styles.subtitle}>
          Спасибо что воспользовались калькулятором на сайте Vibecraft. Ниже —
          ориентировочный расчет стоимости вашей задачи. Точные цифры — после
          короткого обсуждения задачи.
        </Text>

        <Text style={styles.sectionLabel}>Описание задачи</Text>
        <View style={styles.taskBlock}>
          <Text style={styles.taskText}>{description}</Text>
        </View>

        <Text style={styles.sectionLabel}>Расчет</Text>
        <View style={styles.smetaBlock}>
          <Text style={styles.smetaText}>{smeta}</Text>
        </View>

        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>
            <Text style={styles.highlightBold}>Готовы обсудить?</Text> Напишите
            мне в Telegram на @borisk85 — отвечу в течении 1-2 часа в рабочее
            время.
          </Text>
        </View>

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

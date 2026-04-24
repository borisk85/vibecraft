import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
  type DocumentProps,
} from "@react-pdf/renderer";
import path from "node:path";
import type { ReactElement } from "react";

// Шрифт Inter с кириллической поддержкой регистрируется один раз при импорте.
// Файлы в /public/fonts/ скачаны с github.com/rsms/inter.
Font.register({
  family: "Inter",
  fonts: [
    {
      src: path.join(process.cwd(), "public/fonts/Inter-Regular.ttf"),
      fontWeight: "normal",
    },
    {
      src: path.join(process.cwd(), "public/fonts/Inter-Bold.ttf"),
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
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 24,
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
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    borderLeftStyle: "solid",
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
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerBlock: {
    flexDirection: "column",
  },
  footerLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 10,
    color: COLORS.text,
    fontWeight: "bold",
  },
  footerValueLink: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: "bold",
  },
  footerValueMuted: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
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
          <View style={styles.logoBlock}>
            <Text style={styles.logoText}>vibecraft</Text>
            <Text style={styles.logoSubtext}>
              AI-разработка и автоматизации · Казахстан
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate()}</Text>
        </View>

        <Text style={styles.title}>Ориентировочная смета</Text>
        <Text style={styles.subtitle}>
          По описанию вашей задачи рассчитан примерный диапазон стоимости и
          сроков. Точные цифры — после короткого обсуждения задачи.
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
            Борису в Telegram @borisk85 или на hello@vibecraft.kz — отвечу в
            течение 1-2 часов в рабочее время.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerRow}>
            <View style={styles.footerBlock}>
              <Text style={styles.footerLabel}>Telegram</Text>
              <Text style={styles.footerValueLink}>@borisk85</Text>
            </View>
            <View style={styles.footerBlock}>
              <Text style={styles.footerLabel}>Email</Text>
              <Text style={styles.footerValue}>hello@vibecraft.kz</Text>
            </View>
            <View style={styles.footerBlock}>
              <Text style={styles.footerLabel}>Сайт</Text>
              <Text style={styles.footerValueLink}>vibecraft.kz</Text>
            </View>
          </View>
          <Text style={styles.footerValueMuted}>
            Vibecraft — AI-разработка и автоматизации · Казахстан
          </Text>
        </View>
      </Page>
    </Document>
  );
}

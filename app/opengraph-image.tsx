import { ImageResponse } from "next/og";
import { V_PATH, V_VIEWBOX } from "@/lib/logo-path";

export const runtime = "edge";
export const alt = "Vibecraft · AI-разработка";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load font: ${url}`);
  return res.arrayBuffer();
}

export default async function OgImage() {
  const [interSemiBold, interRegular] = await Promise.all([
    loadFont(
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/cyrillic-600-normal.ttf",
    ),
    loadFont(
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/cyrillic-400-normal.ttf",
    ),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A0A0A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
          }}
        >
          <svg
            width="112"
            height="112"
            viewBox={V_VIEWBOX}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d={V_PATH} fill="#EDEDED" />
          </svg>
          <div
            style={{
              fontSize: "128px",
              fontWeight: 600,
              color: "#EDEDED",
              letterSpacing: "-0.03em",
            }}
          >
            Vibecraft
          </div>
        </div>
        <div
          style={{
            marginTop: "40px",
            fontSize: "36px",
            color: "#A1A1A1",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            textAlign: "center",
            maxWidth: "1080px",
          }}
        >
          Telegram-боты · AI-ассистенты · MVP · Мобильные · Автоматизации
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: interSemiBold,
          style: "normal",
          weight: 600,
        },
        {
          name: "Inter",
          data: interRegular,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}

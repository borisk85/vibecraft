import { ImageResponse } from "next/og";

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
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/cyrillic-700-normal.ttf",
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
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "9999px",
              background:
                "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
            }}
          />
          <div
            style={{
              fontSize: "128px",
              fontWeight: 700,
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
            fontSize: "48px",
            color: "#A1A1A1",
            fontWeight: 400,
            letterSpacing: "-0.01em",
          }}
        >
          AI-разработка · Telegram-боты · MVP
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
          weight: 700,
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

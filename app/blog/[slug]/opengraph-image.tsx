import { ImageResponse } from "next/og"
import { V_PATH } from "@/lib/logo-path"
import { posts } from "@/lib/blog-posts"

export const runtime = "edge"
export const alt = "Статья блога Vibecraft"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load font: ${url}`)
  return res.arrayBuffer()
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = posts.find((p) => p.slug === slug && !p.hidden)

  const title = post?.title || "Блог Vibecraft"
  const category = post?.category || "Статья"
  const categoryColor = post?.categoryColor || "#A78BFA"
  const domain = "vibecraft.kz"

  const [jetbrainsMono, interRegular, interBlack] = await Promise.all([
    loadFont(
      "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/cyrillic-600-normal.ttf",
    ),
    loadFont(
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/cyrillic-400-normal.ttf",
    ),
    loadFont(
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/cyrillic-700-normal.ttf",
    ),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A0A",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: `${categoryColor}18`,
              border: `1px solid ${categoryColor}66`,
              borderRadius: 999,
              padding: "8px 20px",
            }}
          >
            <span style={{ color: categoryColor, fontSize: 18, fontWeight: 700 }}>
              {category}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            color: "#EDEDED",
            fontSize: title.length > 70 ? 48 : 60,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 1040,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <svg
              width="42"
              height="36"
              viewBox="290 340 450 380"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d={V_PATH} fill="#EDEDED" />
            </svg>
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 28,
                fontWeight: 600,
                color: "#EDEDED",
                letterSpacing: "-0.02em",
              }}
            >
              vibecraft
            </span>
          </div>
          <span style={{ color: "#A1A1A1", fontSize: 22, fontWeight: 400 }}>
            {domain}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "JetBrains Mono", data: jetbrainsMono, style: "normal", weight: 600 },
        { name: "Inter", data: interRegular, style: "normal", weight: 400 },
        { name: "Inter", data: interBlack, style: "normal", weight: 700 },
      ],
    },
  )
}

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          width="28"
          height="28"
        >
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          <path
            d="M30 25 L40 25 L50 68 L60 25 L78 25 L50 82 L22 33 Z"
            fill="url(#grad)"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}

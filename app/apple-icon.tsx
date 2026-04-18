import { ImageResponse } from "next/og";
import { V_PATH, V_VIEWBOX } from "@/lib/logo-path";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          viewBox={V_VIEWBOX}
          width="180"
          height="180"
        >
          <path d={V_PATH} fill="#8B5CF6" />
        </svg>
      </div>
    ),
    { ...size },
  );
}

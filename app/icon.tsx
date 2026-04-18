import { ImageResponse } from "next/og";
import { V_PATH, V_VIEWBOX } from "@/lib/logo-path";

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
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={V_VIEWBOX}
          width="32"
          height="32"
        >
          <path d={V_PATH} fill="#EDEDED" />
        </svg>
      </div>
    ),
    { ...size },
  );
}

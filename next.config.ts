import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security-заголовки. CSP намеренно НЕ добавлен: без отдельного тестирования
  // может сломать сторонние скрипты. Эти четыре безопасны и закрывают
  // кликджекинг, MIME-sniffing и утечку referrer.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
};

export default nextConfig;

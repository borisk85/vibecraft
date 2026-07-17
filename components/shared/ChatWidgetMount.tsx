"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const ChatWidget = dynamic(() => import("./ChatWidget"), { ssr: false });

export function ChatWidgetMount() {
  const pathname = usePathname();
  // В админке чат-виджет не нужен — мешает. Скрываем на всех /admin-страницах.
  if (pathname?.startsWith("/admin")) return null;
  return <ChatWidget />;
}

import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/metadata";
import { servicePages } from "@/lib/services-pages";
import { posts } from "@/lib/blog-posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const now = new Date();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...servicePages.map((p) => ({
      url: `${base}/uslugi/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    // Сами статьи. Без них в карте сайта Google находит их только по внутренним
    // ссылкам, а проверка метаданных (она берет адреса из sitemap) статьи вообще
    // не видела (22.07: 8 адресов на сайт с блогом).
    ...posts
      .filter((p) => !p.hidden)
      .map((p) => ({
        url: `${base}/blog/${p.slug}`,
        // p.date хранится строкой по-русски («22 июля 2026») — new Date() ее не
        // разбирает и отдает Invalid Date, поэтому ставим текущую.
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
  ];
}

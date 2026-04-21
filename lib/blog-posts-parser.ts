/**
 * Парсер lib/blog-posts.ts — извлекает статьи из TypeScript-исходника
 * с учетом экранированных backticks и backslashes в template literal.
 *
 * НЕ использовать простую regex `content:\s*`([\s\S]*?)`` — она обрывается на
 * первом `\`` внутри content (например `/weather Almaty` стоп-символ).
 */

/**
 * Парсит тело TypeScript template literal начиная с startIdx (после открывающей `).
 * Возвращает { body, endIdx закрывающего ` } или null если не закрыт.
 */
export function parseTemplateBody(
  src: string,
  startIdx: number,
): { body: string; endIdx: number } | null {
  let i = startIdx;
  let out = "";
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\" && i + 1 < src.length) {
      const next = src[i + 1];
      if (next === "`") {
        out += "`";
        i += 2;
        continue;
      }
      if (next === "\\") {
        out += "\\";
        i += 2;
        continue;
      }
      if (next === "$") {
        out += "$";
        i += 2;
        continue;
      }
      out += ch + next;
      i += 2;
      continue;
    }
    if (ch === "`") return { body: out, endIdx: i };
    out += ch;
    i++;
  }
  return null;
}

/**
 * Ищет индекс первого символа тела content-template по slug.
 * Возвращает индекс сразу после открывающей ` или null.
 */
export function findContentStart(blogTs: string, slug: string): number | null {
  const escSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const slugMatch = blogTs.match(new RegExp(`slug:\\s*"${escSlug}"`));
  if (!slugMatch || slugMatch.index === undefined) return null;
  const afterSlug = blogTs.slice(slugMatch.index);
  const contentKeyMatch = afterSlug.match(/content:\s*`/);
  if (!contentKeyMatch || contentKeyMatch.index === undefined) return null;
  return (
    slugMatch.index + contentKeyMatch.index + contentKeyMatch[0].length
  );
}

export type ExtractedPost = {
  title: string;
  excerpt: string;
  category: string;
  iconKey: string;
  content: string;
};

export function extractArticle(
  blogTs: string,
  slug: string,
): ExtractedPost | null {
  const escSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockStart = blogTs.match(
    new RegExp(`\\{\\s*slug:\\s*"${escSlug}"`),
  );
  if (!blockStart || blockStart.index === undefined) return null;
  const contentStart = findContentStart(blogTs, slug);
  if (contentStart === null) return null;
  const parsed = parseTemplateBody(blogTs, contentStart);
  if (!parsed) return null;
  const header = blogTs.slice(blockStart.index, contentStart);
  const titleMatch = header.match(/title:\s*(["'])([^"'\n]+)\1/);
  const excerptMatch = header.match(/excerpt:\s*(["'])([^"'\n]+)\1/);
  const categoryMatch = header.match(/category:\s*(["'])([^"'\n]+)\1/);
  const iconKeyMatch = header.match(/iconKey:\s*(["'])([^"'\n]+)\1/);
  return {
    title: titleMatch?.[2] ?? "",
    excerpt: excerptMatch?.[2] ?? "",
    category: categoryMatch?.[2] ?? "",
    iconKey: iconKeyMatch?.[2] ?? "",
    content: parsed.body,
  };
}

export function replaceContent(
  blogTs: string,
  slug: string,
  newContent: string,
): string {
  const contentStart = findContentStart(blogTs, slug);
  if (contentStart === null) return blogTs;
  const parsed = parseTemplateBody(blogTs, contentStart);
  if (!parsed) return blogTs;
  const escapedNewContent = newContent
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
  return (
    blogTs.slice(0, contentStart) +
    escapedNewContent +
    blogTs.slice(parsed.endIdx)
  );
}

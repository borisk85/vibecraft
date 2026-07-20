/**
 * Размеры картинок статей блога (реальные скриншоты из public/blog).
 * Нужны, чтобы браузер зарезервировал место до загрузки и страница не прыгала.
 * marked размеры в HTML не проставляет, поэтому берем их отсюда.
 *
 * При добавлении нового скриншота — дописать сюда его ширину и высоту.
 */
export const BLOG_IMAGE_SIZES: Record<string, [number, number]> = {
  "/blog/yclients-onlajn-zapis.webp": [1165, 655],
  "/blog/dikidi-marketplace-zapisi.webp": [980, 675],
  "/blog/make-gotovye-svyazki.webp": [913, 775],
  "/blog/n8n-ii-agent-workflow.webp": [985, 575],
  "/blog/zoho-inventory-ostatki.webp": [1200, 716],
  "/blog/zoho-inventory-dokumenty.webp": [1200, 775],
};

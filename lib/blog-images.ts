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
  "/blog/chatgpt-razbor-dogovora.webp": [1200, 653],
  "/blog/make-gotovye-svyazki.webp": [913, 775],
  "/blog/n8n-ii-agent-workflow.webp": [985, 575],
  "/blog/zoho-inventory-ostatki.webp": [1200, 716],
  "/blog/zoho-inventory-dokumenty.webp": [1200, 775],
  "/blog/esf-portal-kgd.webp": [1200, 556],
  "/blog/esf-vhod-ncalayer.webp": [1200, 516],
  "/blog/esf-api-uchetnye-sistemy.webp": [1000, 814],
  "/blog/esf-sposob-avtorizacii.webp": [1200, 356],
  "/blog/vibecraft-uslugi-ceny.webp": [1074, 412],
  "/blog/vibecraft-kalkulyator-stoimosti.webp": [880, 585],
  "/blog/vibecraft-ii-chat-konsultant.webp": [380, 643],
  "/blog/vibecraft-chat-konsultant-ip.webp": [440, 714],
  "/blog/kabinet-nalogoplatelshchika-vhod.webp": [1200, 805],
  "/blog/kaspi-guide-api-instrukciya.webp": [744, 454],
  "/blog/favor-it-modul-1c-kaspi.webp": [1200, 740],
  "/blog/vibecraft-sajt-chto-vhodit.webp": [1100, 662],
  "/blog/seo-raboty-po-mesyacam.webp": [1100, 878],
  "/blog/seo-tarify-almaty.webp": [1000, 441],
};

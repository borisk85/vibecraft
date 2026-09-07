/*
  Фирменная обертка писем Vibecraft.

  Стили и палитра взяты из письма калькулятора (app/api/calculator/route.ts):
  белая карточка 600px на светлом фоне, шапка с иконкой и названием, акцент
  #8B5CF6, футер с контактами. Верстка на таблицах и inline-стилях — Gmail и
  Outlook режут <style> в head и не понимают flex.

  Логотип отдается страницей /icon как PNG: SVG в почте не показывает ни
  Gmail, ни Outlook.
*/

import { siteConfig } from "@/lib/metadata";

const LOGO_URL = `${siteConfig.url}/icon`;

const SOCIALS = [
  { name: "telegram", label: "Telegram", href: siteConfig.contacts.telegram },
  { name: "linkedin", label: "LinkedIn", href: siteConfig.contacts.linkedin },
  { name: "instagram", label: "Instagram", href: siteConfig.contacts.instagram },
  { name: "facebook", label: "Facebook", href: siteConfig.contacts.facebook },
];

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Свободный текст в абзацы письма: пустая строка разделяет абзацы. */
export function textToParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#0a0a0a;">${escapeHtml(
          block,
        ).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}

/**
 * Собирает письмо: шапка, тело, подпись, соцсети, футер.
 *
 * @param title    заголовок в теле письма (h1)
 * @param bodyHtml готовый HTML тела (обычно из textToParagraphs)
 * @param preheader короткая строка предпросмотра в списке писем
 */
export function renderEmail({
  title,
  bodyHtml,
  preheader = "",
}: {
  title: string;
  bodyHtml: string;
  preheader?: string;
}): string {
  const socialIcons = SOCIALS.map(
    (s) =>
      `<td style="padding-right:14px;"><a href="${s.href}"><img src="${siteConfig.url}/email-icon/${s.name}" alt="${s.label}" width="20" height="20" style="display:block;border:0;" /></a></td>`,
  ).join("");

  return `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0a0a0a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;">
    <tr><td align="center" style="padding:24px 12px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;">
        <tr><td style="padding:32px 32px 40px 32px;">

          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid #e5e5e5;padding-bottom:16px;margin-bottom:24px;">
            <tr>
              <td width="52" valign="middle" style="padding-bottom:16px;">
                <table cellpadding="0" cellspacing="0" border="0"><tr>
                  <td width="40" height="40" align="center" valign="middle" style="background:#0A0A0A;border-radius:8px;">
                    <img src="${LOGO_URL}" alt="Vibecraft" width="28" height="28" style="display:block;" />
                  </td>
                </tr></table>
              </td>
              <td valign="middle" style="padding-bottom:16px;">
                <div style="font-size:20px;font-weight:700;letter-spacing:-0.4px;color:#0a0a0a;line-height:1;">vibecraft</div>
                <div style="font-size:11px;color:#5a5a5a;margin-top:4px;">ИИ-разработка и автоматизации · Казахстан</div>
              </td>
            </tr>
          </table>

          ${bodyHtml}

          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
            <tr><td style="border-top:1px solid #e5e5e5;padding-top:20px;">
              <div style="font-size:15px;font-weight:700;color:#0a0a0a;">Борис Комаров</div>
              <div style="font-size:13px;color:#5a5a5a;margin-top:2px;">Основатель Vibecraft</div>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
            <tr><td style="border-top:1px solid #e5e5e5;padding-top:16px;font-size:11px;color:#5a5a5a;line-height:1.6;">
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;"><tr>${socialIcons}</tr></table>
              <div>Это ответ на вашу заявку с сайта <a href="${siteConfig.url}" style="color:#5a5a5a;">vibecraft.kz</a>.</div>
            </td></tr>
          </table>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Текстовая версия письма: без нее почтовые фильтры считают письмо подозрительным. */
export function renderEmailText(title: string, body: string): string {
  return [
    title,
    "",
    body.trim(),
    "",
    "—",
    "Борис Комаров, основатель Vibecraft",
    `Telegram: ${siteConfig.contacts.telegramHandle} · ${siteConfig.contacts.email} · vibecraft.kz`,
  ].join("\n");
}

export interface Lang {
  name: string;
  code: string;
}

// 🔴 فقط فارسی — عمداً.
//
// این نسخه‌ی Classeh است و همه‌ی کاربرانش دانش‌آموز و والد و معلمِ ایرانی‌اند.
// نگه‌داشتنِ ۱۵ زبانِ دیگر یعنی یک منوی زبان که هیچ‌کس لازمش ندارد و هرکسی
// که اشتباهی بزندش صفحه‌ای می‌بیند که نمی‌فهمد.
//
// `layout.tsx` سوییچر را وقتی فقط یک زبان هست اصلاً رندر نمی‌کند، پس این
// آرایه هم فهرست را تعیین می‌کند هم اینکه سوییچر دیده شود یا نه.
//
// ⚠️ `fa` را خودِ ZITADEL پشتیبانی نمی‌کند — نه در این اپ و نه در بکند
// (`PUT /admin/v1/languages/default/fa` جواب می‌دهد
// «Language is not supported»). پس زبانِ پیش‌فرضِ instance را روی `fa`
// نگذارید؛ این‌جا تنها گزینه بودنش کافی است، چون `request.ts` وقتی
// `allowedLanguages` از سرور خالی بیاید همین آرایه را مبنا می‌گیرد.
export const LANGS: Lang[] = [
  {
    name: "فارسی",
    code: "fa",
  },
];

export const LANGUAGE_COOKIE_NAME = "NEXT_LOCALE";
export const LANGUAGE_HEADER_NAME = "accept-language";

export function shouldUILocalesOverrideCookie(): boolean {
  return process.env.ZITADEL_UI_LOCALES_OVERRIDE_COOKIE === "true";
}

export function getLanguage(code: string): Lang {
  const lang = LANGS.find((l) => l.code === code);
  if (lang) {
    return lang;
  }

  return {
    code,
    name: new Intl.DisplayNames([code], { type: "language" }).of(code) || code,
  };
}

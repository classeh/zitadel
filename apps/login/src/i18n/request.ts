import { LANGS, LANGUAGE_COOKIE_NAME, LANGUAGE_HEADER_NAME } from "@/lib/i18n";
import { getServiceConfig } from "@/lib/service-url";
import { getAllowedLanguages } from "@/lib/zitadel";
import { JsonObject } from "@zitadel/client";
import deepmerge from "deepmerge";
import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export default getRequestConfig(async () => {
  // این build فقط فارسی دارد (`LANGS`)، پس fallback هم فارسی است.
  const fallback = "fa";
  const cookiesList = await cookies();

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  let allowedLanguages = LANGS.map((l) => l.code);
  let defaultLanguage = fallback;

  try {
    const settings = await getAllowedLanguages({ serviceConfig });
    if (settings.allowedLanguages?.length) {
      const localLanguageCodes = LANGS.map((l) => l.code);
      allowedLanguages = settings.allowedLanguages.filter((l) => localLanguageCodes.includes(l));
    }
    // 🔴 زبانِ پیش‌فرضِ سرور فقط وقتی پذیرفته می‌شود که واقعاً در این build
    // وجود داشته باشد.
    //
    // بدونِ این شرط، instance که `en` را برمی‌گرداند locale را `en` می‌کرد —
    // زبانی که این build اصلاً ندارد — و صفحه انگلیسی می‌ماند در حالی که
    // تنها گزینه‌ی موجود فارسی است. ZITADEL هم `fa` را نمی‌پذیرد
    // (`PUT /admin/v1/languages/default/fa` جواب می‌دهد
    // «Language is not supported»)، پس سمتِ سرور راهی برای درست کردنش نیست.
    if (settings.defaultLanguage && LANGS.some((l) => l.code === settings.defaultLanguage)) {
      defaultLanguage = settings.defaultLanguage;
    }
  } catch (e) {
    console.warn("Failed to load global settings", e);
  }

  let locale: string = defaultLanguage;

  const languageHeader = await (await headers()).get(LANGUAGE_HEADER_NAME);
  if (languageHeader) {
    // splits "en-US,en;q=0.9" to ["en", "US"] or ["en"]
    const headerLocale = languageHeader.split(",")[0].split("-")[0];
    if (allowedLanguages.includes(headerLocale)) {
      locale = headerLocale;
    }
  }

  const languageCookie = cookiesList?.get(LANGUAGE_COOKIE_NAME);
  if (languageCookie && languageCookie.value) {
    if (allowedLanguages.includes(languageCookie.value)) {
      locale = languageCookie.value;
    } else {
      // If the cookie tells a language that is other than the supported ones, fall back to the default.
      locale = defaultLanguage;
    }
  }

  // 🔴 ترجمه‌های سمتِ سرور عمداً خوانده نمی‌شوند.
  //
  // این fork تک‌زبانه است و `locales/fa.json` داخلِ خودِ image است، پس آن
  // مسیر چیزی اضافه نمی‌کند — ولی چیزی خراب می‌کند: پاسخش آخر merge می‌شود
  // و فارسیِ بسته‌شده در image را با انگلیسی می‌پوشاند.
  //
  // اندازه‌گیری‌شده روی همین استقرار: درخواستی که هدرهای host ندارد ۴۰۴
  // می‌گیرد و صفحه فارسی می‌ماند؛ همان درخواست از پشتِ گیت‌وی — که
  // `x-zitadel-instance-host` را می‌فرستد — ۲۰۰ می‌گیرد و صفحه انگلیسی
  // می‌شود. یعنی صفحه بسته به مسیرِ رسیدن به آن، دو زبانِ متفاوت داشت.
  //
  // ⚠️ اگر روزی ترجمه‌ی به‌ازای سازمان لازم شد، این را برگردانید و اول
  // شکلِ خروجی `getHostedLoginTranslation` را وارسی کنید؛ روی gRPC یک
  // `google.protobuf.Struct` است و آبجکتِ ساده نیست.
  const customMessages: JsonObject | Record<string, never> = {};

  // Load locale messages, fall back to default language messages if locale not found
  let localeMessages;
  try {
    localeMessages = (await import(`../../locales/${locale}.json`)).default;
  } catch {
    try {
      localeMessages = (await import(`../../locales/${defaultLanguage}.json`)).default;
    } catch {
      localeMessages = (await import(`../../locales/${fallback}.json`)).default;
    }
  }

  const fallbackMessages = (await import(`../../locales/${fallback}.json`)).default;

  return {
    locale,
    messages: deepmerge.all([fallbackMessages, localeMessages, customMessages]) as Record<string, string>,
  };
});

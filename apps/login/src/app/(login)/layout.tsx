import "@/styles/globals.scss";
// بعد از globals، تا رویش بنشیند.
import "@/styles/classeh.scss";

import { BackgroundWrapper } from "@/components/background-wrapper";
import { LanguageProvider } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Skeleton } from "@/components/skeleton";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeSwitch from "@/components/theme-switch";
import { LANGS, getLanguage } from "@/lib/i18n";
import { getServiceConfig } from "@/lib/service-url";
import { getAllowedLanguages } from "@/lib/zitadel";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import localFont from "next/font/local";
import { headers } from "next/headers";
import React, { Suspense } from "react";

// Estedad — همان فونتی که core-app و صفحه‌ی لاگینِ Keycloak استفاده می‌کنند،
// و همان سه وزنی که آن صفحه واقعاً به کار می‌برد.
//
// 🔴 `next/font/local` و نه `next/font/google`. دو دلیل، هر دو لازم:
// فونتِ لاتینِ Lato برای متنِ فارسی غلط است، و `next/font/google` موقعِ
// build از گوگل دانلود می‌کند — که از ایران یعنی buildی که گاهی کار می‌کند
// و گاهی نه. این‌جا فایل‌ها در مخزن‌اند و build آفلاین است.
const estedad = localFont({
  src: [
    { path: "../../../public/fonts/Estedad-FD-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../../public/fonts/Estedad-FD-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../../public/fonts/Estedad-FD-Bold.woff2", weight: "700", style: "normal" },
  ],
  // پشته‌ی سیستمی به‌عنوان fallback: اگر روزی فایل‌ها نبودند، صفحه بی‌فونت
  // نشود.
  fallback: ["Vazirmatn", "IRANSans", "Tahoma", "sans-serif"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("title") };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  let languages = LANGS;
  try {
    const settings = await getAllowedLanguages({ serviceConfig });
    if (settings.allowedLanguages?.length) {
      languages = settings.allowedLanguages
        .filter((code) => LANGS.find((l) => l.code === code))
        .map((code) => getLanguage(code));
    }
  } catch (e) {
    console.error("Failed to load supported languages", e);
  }

  return (
    // 🔴 `dir="rtl"` و `lang="fa"` — ZITADEL هیچ‌جا جهت را ست نمی‌کند، حتی
    // برای عربی. بدون این، متنِ فارسی چپ‌چین رندر می‌شود: برچسب‌های کوتاه
    // تحمل‌پذیرند ولی جمله‌هایی مثل «کدی که در ایمیل تأیید دریافت کردید وارد
    // کنید» به‌هم می‌ریزند. این نسخه تک‌زبانه است، پس جهت ثابت است و شرطی
    // لازم ندارد.
    <html className={`${estedad.className}`} dir="rtl" lang="fa" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider>
          <Tooltip.Provider>
            <Suspense
              fallback={
                <BackgroundWrapper
                  className={`bg-background-light-600 dark:bg-background-dark-600 relative flex min-h-screen flex-col justify-center`}
                >
                  <div className="relative mx-auto w-full max-w-[440px] py-8">
                    <Skeleton>
                      <div className="h-40"></div>
                    </Skeleton>
                    <div className="flex flex-row items-center justify-end space-x-4 py-4">
                      <ThemeSwitch />
                    </div>
                  </div>
                </BackgroundWrapper>
              }
            >
              <LanguageProvider>
                <BackgroundWrapper
                  className={`bg-background-light-600 dark:bg-background-dark-600 relative flex min-h-screen flex-col justify-center`}
                >
                  <div className="relative mx-auto w-full max-w-[1100px] py-8">
                    <div>{children}</div>
                    <div className="mx-auto flex max-w-[440px] flex-row items-center justify-end space-x-4 px-4 py-4 md:max-w-full md:px-8">
                      {/* یک زبان یعنی چیزی برای انتخاب نیست؛ سوییچر فقط یک
                          منوی تک‌گزینه‌ای می‌شد. */}
                      {languages.length > 1 && <LanguageSwitcher languages={languages} />}
                      <ThemeSwitch />
                    </div>
                  </div>
                </BackgroundWrapper>
              </LanguageProvider>
            </Suspense>
          </Tooltip.Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}

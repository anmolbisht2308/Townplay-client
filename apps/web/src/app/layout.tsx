import { cityResponseSchema } from "@townplay/shared";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Bricolage_Grotesque, Inter, Noto_Sans_Devanagari } from "next/font/google";
import type { ReactNode } from "react";
import { z } from "zod";
import { LanguageSwitcher } from "@/components/language-switcher";
import { HeaderAccount } from "@/components/layout/header-account";
import { Logo } from "@/components/layout/logo";
import { BottomNav, HeaderNav } from "@/components/layout/nav-links";
import { Providers } from "@/components/providers";
import { clientEnv } from "@/env";
import { serverGet } from "@/lib/server-api";
import "./globals.css";

// Self-hosted at build time (no request to Google from the browser). Devanagari is only
// downloaded by phones that actually render Hindi text (unicode-range subsets).
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const heading = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});
const deva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-deva",
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
    title: { default: `${t("appName")} · ${t("tagline")}`, template: `%s · ${t("appName")}` },
    description: t("tagline"),
    applicationName: t("appName"),
    openGraph: { siteName: t("appName"), type: "website", locale: "en_IN" },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f9d55",
};

/** First active city: where "Explore" and the tab bar point. */
async function defaultCitySlug() {
  const cities = await serverGet("/cities", z.array(cityResponseSchema), 300).catch(() => []);
  return cities[0]?.slug ?? "bareilly";
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations("common");
  const citySlug = await defaultCitySlug();
  return (
    <html lang={locale} className={`${body.variable} ${heading.variable} ${deva.variable}`}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>
          <Providers>
            <a
              href="#main"
              className="sr-only rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
            >
              {t("skipToContent")}
            </a>
            <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
              <div className="mx-auto flex h-[var(--header-h)] max-w-6xl items-center justify-between gap-3 px-4">
                <Logo name={t("appName")} />
                <HeaderNav citySlug={citySlug} />
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <HeaderAccount />
                </div>
              </div>
            </header>
            <main
              id="main"
              className="mx-auto max-w-6xl px-4 pb-[calc(var(--bottom-nav-h)+2rem)] md:pb-16"
            >
              {children}
            </main>
            <BottomNav citySlug={citySlug} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

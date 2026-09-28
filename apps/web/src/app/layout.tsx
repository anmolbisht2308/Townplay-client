import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Providers } from "@/components/providers";
import { clientEnv } from "@/env";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
    title: { default: t("appName"), template: `%s · ${t("appName")}` },
    description: t("tagline"),
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#16a34a" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations("common");
  return (
    <html lang={locale}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>
          <Providers>
            <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
              <Link href="/" className="text-lg font-semibold text-primary">
                {t("appName")}
              </Link>
              <LanguageSwitcher />
            </header>
            <main className="mx-auto max-w-3xl px-4 pb-12">{children}</main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

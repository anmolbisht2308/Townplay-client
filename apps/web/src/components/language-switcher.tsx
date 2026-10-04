"use client";

import { LANGS, type Lang } from "@townplay/shared";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { cn } from "@/lib/utils";

const LABELS: Record<Lang, string> = { en: "EN", hi: "हिं" };
const NAMES: Record<Lang, string> = { en: "English", hi: "हिन्दी" };

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(lang: Lang) {
    startTransition(async () => {
      await setLocale(lang);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="flex rounded-full border bg-card p-0.5 text-xs font-semibold shadow-sm"
    >
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          disabled={pending}
          aria-pressed={locale === lang}
          onClick={() => choose(lang)}
          aria-label={NAMES[lang]}
          className={cn(
            "pressable min-w-9 rounded-full px-2.5 py-1.5",
            locale === lang
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {LABELS[lang]}
        </button>
      ))}
    </div>
  );
}

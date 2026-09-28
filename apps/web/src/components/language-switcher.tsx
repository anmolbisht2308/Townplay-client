"use client";

import { LANGS, type Lang } from "@townplay/shared";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { cn } from "@/lib/utils";

const LABELS: Record<Lang, string> = { en: "English", hi: "हिन्दी" };

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
    <div role="group" aria-label={t("language")} className="flex gap-1 text-sm">
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          disabled={pending}
          aria-pressed={locale === lang}
          onClick={() => choose(lang)}
          className={cn(
            "rounded-md px-2 py-1",
            locale === lang ? "bg-primary text-primary-foreground" : "hover:bg-accent",
          )}
        >
          {LABELS[lang]}
        </button>
      ))}
    </div>
  );
}

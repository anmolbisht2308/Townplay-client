import { LANGS, type Lang } from "@townplay/shared";

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const DEFAULT_LOCALE: Lang = "en";

export function toLocale(value: string | undefined): Lang {
  return LANGS.find((l) => l === value) ?? DEFAULT_LOCALE;
}

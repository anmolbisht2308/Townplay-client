/** Short label for an IST date string, e.g. "Mon 28" (en) / "सोम 28" (hi). */
export function dayLabel(
  date: string,
  locale: string,
): { weekday: string; day: string; month: string } {
  const d = new Date(`${date}T12:00:00+05:30`);
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
      timeZone: "Asia/Kolkata",
      ...o,
    }).format(d);
  return {
    weekday: fmt({ weekday: "short" }),
    day: fmt({ day: "numeric" }),
    month: fmt({ month: "short" }),
  };
}

export function longDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00+05:30`));
}

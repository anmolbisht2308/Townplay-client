/** "Mon, Wed, Fri" (or "Every day") for a batch's weekdays, using the weekdaysShort messages. */
export function daysLabel(days: readonly number[], t: (key: string) => string): string {
  if (days.length === 7) return t("venue.allDays");
  return [...days]
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)) // Monday first
    .map((d) => t(`weekdaysShort.${d}`))
    .join(", ");
}

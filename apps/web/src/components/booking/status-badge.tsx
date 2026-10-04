import type { BookingStatus } from "@townplay/shared";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const TONE: Record<BookingStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-900 [--dot:var(--color-amber-500)]",
  confirmed: "bg-primary-soft text-primary-strong [--dot:var(--primary)]",
  completed: "bg-accent text-foreground [--dot:var(--muted-foreground)]",
  cancelled: "bg-red-100 text-red-900 [--dot:var(--destructive)]",
  no_show: "bg-red-100 text-red-900 [--dot:var(--destructive)]",
  expired: "bg-accent text-muted-foreground [--dot:var(--muted-foreground)]",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const t = useTranslations("bookings.status");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        TONE[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--dot)]" />
      {t(status)}
    </span>
  );
}

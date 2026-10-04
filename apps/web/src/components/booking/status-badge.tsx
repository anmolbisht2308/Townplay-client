import type { BookingStatus } from "@townplay/shared";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const TONE: Record<BookingStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-900",
  confirmed: "bg-green-100 text-green-900",
  completed: "bg-accent text-foreground",
  cancelled: "bg-red-100 text-red-900",
  no_show: "bg-red-100 text-red-900",
  expired: "bg-accent text-muted-foreground",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const t = useTranslations("bookings.status");
  return <span className={cn("rounded-full px-2 py-0.5 text-xs", TONE[status])}>{t(status)}</span>;
}

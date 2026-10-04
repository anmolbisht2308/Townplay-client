import type { TicketOrderStatus } from "@townplay/shared";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const TONE: Record<TicketOrderStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-900",
  paid: "bg-green-100 text-green-900",
  cancelled: "bg-red-100 text-red-900",
  refunded: "bg-red-100 text-red-900",
  expired: "bg-accent text-muted-foreground",
};

export function OrderStatusBadge({ status }: { status: TicketOrderStatus }) {
  const t = useTranslations("tickets.status");
  return <span className={cn("rounded-full px-2 py-0.5 text-xs", TONE[status])}>{t(status)}</span>;
}

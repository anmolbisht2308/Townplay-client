import type { MembershipStatus } from "@townplay/shared";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const TONE: Record<MembershipStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-900",
  active: "bg-green-100 text-green-900",
  expired: "bg-accent text-muted-foreground",
  cancelled: "bg-red-100 text-red-900",
};

export function MembershipStatusBadge({ status }: { status: MembershipStatus }) {
  const t = useTranslations("memberships.status");
  return <span className={cn("rounded-full px-2 py-0.5 text-xs", TONE[status])}>{t(status)}</span>;
}

"use client";

import { ticketOrderSchema } from "@townplay/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { z } from "zod";
import { AuthGate } from "@/components/auth-gate";
import { OrderStatusBadge } from "@/components/events/order-status";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { eventWhen } from "@/lib/event-time";

function List() {
  const t = useTranslations("tickets");
  const tc = useTranslations("common");
  const locale = useLocale();
  const orders = useQuery({
    queryKey: ["ticket-orders"],
    queryFn: () => api.get("/ticket-orders/mine", z.array(ticketOrderSchema)),
  });
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {orders.isPending && <p className="text-muted-foreground">{tc("loading")}</p>}
      {orders.isError && <p className="text-destructive">{tc("error")}</p>}
      {orders.data?.length === 0 && (
        <div className="space-y-3">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Link href="/bareilly/events" className={buttonVariants({ variant: "outline" })}>
            {t("findEvents")}
          </Link>
        </div>
      )}
      <ul className="space-y-3">
        {orders.data?.map((o) => (
          <li key={o.id}>
            <Link
              href={`/tickets/${o.id}`}
              className="block space-y-1 rounded-lg border p-3 hover:bg-accent"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{o.event.title}</p>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="text-sm">{o.event.startsAt && eventWhen(o.event.startsAt, locale)}</p>
              <p className="text-sm text-muted-foreground">
                {t("order", { code: o.code })} · {o.items.reduce((s, i) => s + i.qty, 0)} ×
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MyTicketsPage() {
  return <AuthGate>{() => <List />}</AuthGate>;
}

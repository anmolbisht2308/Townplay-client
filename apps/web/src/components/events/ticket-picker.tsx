"use client";

import {
  MAX_TICKETS_PER_ORDER,
  convenienceFeePaise,
  customerSchema,
  formatPaise,
  paymentsConfigSchema,
  ticketOrderSchema,
  type Tier,
} from "@townplay/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/use-me";
import { ApiError, api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function TicketPicker({
  eventId,
  tiers,
  closed,
}: {
  eventId: string;
  tiers: Tier[];
  closed: boolean;
}) {
  const t = useTranslations("events");
  const router = useRouter();
  const me = useMe();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const config = useQuery({
    queryKey: ["payments-config"],
    queryFn: () => api.get("/payments/config", paymentsConfigSchema),
    staleTime: 5 * 60_000,
  });

  const count = Object.values(qty).reduce((a, b) => a + b, 0);
  const total = tiers.reduce((s, tier) => s + (qty[tier.id] ?? 0) * tier.pricePaise, 0);
  const fee = config.data ? convenienceFeePaise(total, config.data.convenienceFee) : 0;

  const reserve = useMutation({
    mutationFn: () =>
      api.send("POST", "/ticket-orders", ticketOrderSchema, {
        eventId,
        items: Object.entries(qty)
          .filter(([, n]) => n > 0)
          .map(([tierId, n]) => ({ tierId, qty: n })),
        buyer: { name: name.trim() || me.data?.name || "", phone },
      }),
    onSuccess: (order) => router.push(`/tickets/${order.id}`),
    onError: (err) => {
      if (err instanceof ApiError && err.code === "SOLD_OUT") setError(t("soldOutError"));
      else if (err instanceof ApiError && err.code === "EVENT_STARTED") setError(t("closed"));
      else setError(err instanceof ApiError ? err.message : String(err));
    },
  });

  function change(tier: Tier, delta: number) {
    setError(null);
    setQty((q) => {
      const next = Math.max(0, Math.min((q[tier.id] ?? 0) + delta, tier.remaining));
      if (count - (q[tier.id] ?? 0) + next > MAX_TICKETS_PER_ORDER) return q;
      return { ...q, [tier.id]: next };
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!customerSchema.safeParse({ name: name.trim() || me.data?.name || "", phone }).success) {
      return setError(t("phone"));
    }
    reserve.mutate();
  }

  if (closed) return <p className="text-sm text-muted-foreground">{t("closed")}</p>;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{t("tickets")}</h2>
      <ul className="space-y-2">
        {tiers.map((tier) => (
          <li
            key={tier.id}
            className="flex items-center justify-between gap-2 rounded-lg border p-3"
          >
            <div>
              <p className="font-medium">{tier.name}</p>
              <p className="text-sm text-muted-foreground">
                {tier.pricePaise === 0 ? t("free") : formatPaise(tier.pricePaise)} ·{" "}
                {tier.remaining > 0 ? t("left", { count: tier.remaining }) : t("soldOut")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="−"
                disabled={!qty[tier.id]}
                onClick={() => change(tier, -1)}
              >
                −
              </Button>
              <span className="w-6 text-center tabular-nums" aria-live="polite">
                {qty[tier.id] ?? 0}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="+"
                disabled={tier.remaining <= (qty[tier.id] ?? 0) || count >= MAX_TICKETS_PER_ORDER}
                onClick={() => change(tier, 1)}
              >
                +
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {count === 0 && <p className="text-xs text-muted-foreground">{t("pickTickets")}</p>}
      {count > 0 && (
        <form onSubmit={submit} className="space-y-3 rounded-lg border p-3" noValidate>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>{t("total")}</dt>
              <dd>{formatPaise(total)}</dd>
            </div>
            {fee > 0 && (
              <div className="flex justify-between">
                <dt>{t("fee")}</dt>
                <dd>{formatPaise(fee)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 font-medium">
              <dt>{t("payNow")}</dt>
              <dd>{formatPaise(total + fee)}</dd>
            </div>
          </dl>
          {me.data ? (
            <>
              <Field label={t("yourName")}>
                <Input
                  autoComplete="name"
                  value={name}
                  placeholder={me.data.name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label={t("phone")}>
                <Input
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Button type="submit" size="lg" className="w-full" disabled={reserve.isPending}>
                {total + fee === 0 ? t("rsvp") : t("buy")}
              </Button>
            </>
          ) : (
            <Link href="/sign-in" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
              {t("signIn")}
            </Link>
          )}
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}

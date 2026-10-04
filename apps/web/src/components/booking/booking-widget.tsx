"use client";

import {
  bookableDates,
  bookingAmount,
  bookingSchema,
  customerSchema,
  formatPaise,
  paymentsConfigSchema,
  timeToMinutes,
  venueAvailabilitySchema,
  type Slot,
} from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/use-me";
import { ApiError, api } from "@/lib/api";
import { dayLabel } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Adds/removes a slot so the selection stays one run of back-to-back slots. */
export function toggleSlot(selected: string[], start: string, duration: number): string[] {
  const mins = selected.map(timeToMinutes).sort((a, b) => a - b);
  const m = timeToMinutes(start);
  if (mins.length === 0) return [start];
  const first = mins[0]!;
  const last = mins.at(-1)!;
  if (m === first || m === last) return selected.filter((s) => s !== start);
  if (m === first - duration || m === last + duration) return [...selected, start].sort();
  return [start];
}

export function BookingWidget({
  venueId,
  advancePercent,
}: {
  venueId: string;
  advancePercent: number;
}) {
  const t = useTranslations("booking");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useMe();
  const dates = useMemo(() => bookableDates(), []);
  const [date, setDate] = useState(dates[0]!);
  const [courtIndex, setCourtIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const availability = useQuery({
    queryKey: ["availability", venueId, date],
    queryFn: () => api.get(`/venues/${venueId}/availability?date=${date}`, venueAvailabilitySchema),
    refetchInterval: 30_000,
  });
  const config = useQuery({
    queryKey: ["payments-config"],
    queryFn: () => api.get("/payments/config", paymentsConfigSchema),
    staleTime: 5 * 60_000,
  });
  const court = availability.data?.resources[courtIndex];
  const picked = (court?.slots ?? []).filter((s) => selected.includes(s.startTime));
  const amount = bookingAmount(
    picked.map((s) => s.pricePaise ?? 0),
    advancePercent,
    config.data?.convenienceFee,
  );
  const payNow = amount.advancePaise + amount.convenienceFeePaise;

  const hold = useMutation({
    mutationFn: () =>
      api.send("POST", "/bookings/hold", bookingSchema, {
        resourceId: court!.resourceId,
        date,
        startTimes: selected,
        customer: { name: name.trim() || me.data?.name || "", phone },
      }),
    onSuccess: (b) => router.push(`/bookings/${b.id}`),
    onError: async (err) => {
      if (err instanceof ApiError && err.code === "SLOT_TAKEN") {
        setError(t("slotTaken"));
        setSelected([]);
        await queryClient.invalidateQueries({ queryKey: ["availability", venueId, date] });
      } else setError(err instanceof ApiError ? err.message : String(err));
    },
  });

  function pickDate(d: string) {
    setDate(d);
    setSelected([]);
    setError(null);
  }

  function tap(slot: Slot) {
    if (slot.status !== "available" || !court) return;
    setError(null);
    setSelected((s) => toggleSlot(s, slot.startTime, court.slotDurationMins));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const customer = customerSchema.safeParse({ name: name.trim() || me.data?.name || "", phone });
    if (!customer.success) return setError(t("invalidCustomer"));
    hold.mutate();
  }

  return (
    <section className="space-y-3" aria-labelledby="book-heading">
      <h2 id="book-heading" className="text-lg font-semibold">
        {t("title")}
      </h2>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist">
        {dates.map((d, i) => {
          const l = dayLabel(d, locale);
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={d === date}
              onClick={() => pickDate(d)}
              className={cn(
                "flex w-14 shrink-0 flex-col items-center rounded-lg border py-1.5 text-xs",
                d === date
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent",
              )}
            >
              <span>{i === 0 ? t("today") : i === 1 ? t("tomorrow") : l.weekday}</span>
              <span className="text-base font-semibold">{l.day}</span>
              <span>{l.month}</span>
            </button>
          );
        })}
      </div>

      {availability.isPending && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
      {availability.data && availability.data.resources.length > 1 && (
        <div className="flex gap-2 overflow-x-auto" role="tablist">
          {availability.data.resources.map((r, i) => (
            <button
              key={r.resourceId}
              type="button"
              role="tab"
              aria-selected={i === courtIndex}
              onClick={() => {
                setCourtIndex(i);
                setSelected([]);
              }}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-sm",
                i === courtIndex && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {court && court.slots.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("noSlots")}</p>
      )}
      {court && court.slots.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">{t("selectHint")}</p>
          <ul className="grid grid-cols-3 gap-2">
            {court.slots.map((s) => {
              const isSelected = selected.includes(s.startTime);
              return (
                <li key={s.startTime}>
                  <button
                    type="button"
                    disabled={s.status !== "available"}
                    aria-pressed={isSelected}
                    onClick={() => tap(s)}
                    className={cn(
                      "flex w-full flex-col items-center rounded-md border px-1 py-2 text-sm",
                      s.status === "available" && !isSelected && "hover:border-primary",
                      isSelected && "border-primary bg-primary text-primary-foreground",
                      s.status !== "available" &&
                        "cursor-not-allowed bg-accent text-muted-foreground line-through",
                    )}
                  >
                    <span className="font-medium">{s.startTime}</span>
                    <span className="text-xs">
                      {s.status === "available" && s.pricePaise !== null
                        ? formatPaise(s.pricePaise)
                        : t(s.status)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {picked.length > 0 && (
        <form onSubmit={submit} className="space-y-3 rounded-lg border p-3" noValidate>
          <p className="font-medium">
            {t("summary", {
              count: picked.length,
              start: picked[0]!.startTime,
              end: picked.at(-1)!.endTime,
            })}
          </p>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>{t("total")}</dt>
              <dd>{formatPaise(amount.totalPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t("advance")}</dt>
              <dd>{formatPaise(amount.advancePaise)}</dd>
            </div>
            {amount.convenienceFeePaise > 0 && (
              <div className="flex justify-between">
                <dt>{t("fee")}</dt>
                <dd>{formatPaise(amount.convenienceFeePaise)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 font-medium">
              <dt>{t("payNow")}</dt>
              <dd>{formatPaise(payNow)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>{t("balance")}</dt>
              <dd>{formatPaise(amount.balancePaise)}</dd>
            </div>
          </dl>
          {me.data ? (
            <>
              <Field label={t("name")}>
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
              <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
              <Button type="submit" size="lg" className="w-full" disabled={hold.isPending}>
                {amount.advancePaise > 0
                  ? t("hold", { amount: formatPaise(amount.advancePaise) })
                  : t("holdFree")}
              </Button>
            </>
          ) : (
            <Link href="/sign-in" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
              {t("signInToBook")}
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

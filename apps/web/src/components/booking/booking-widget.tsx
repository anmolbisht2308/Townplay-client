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
    <section
      className="space-y-4 rounded-2xl border bg-card p-4 shadow-card md:p-5"
      aria-labelledby="book-heading"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="book-heading" className="text-xl font-extrabold">
          {t("title")}
        </h2>
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          {t("live")}
        </span>
      </div>

      <div
        className="scroller -mx-4 gap-2 px-4 pb-1 md:-mx-5 md:px-5 md:[--scroller-pad:1.25rem]"
        role="tablist"
      >
        {dates.map((d, i) => {
          const l = dayLabel(d, locale);
          const on = d === date;
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => pickDate(d)}
              className={cn(
                "pressable flex w-16 shrink-0 flex-col items-center rounded-2xl border py-2 text-xs font-medium",
                on
                  ? "border-foreground bg-foreground text-background shadow-card"
                  : "bg-card hover:border-primary",
              )}
            >
              <span className={on ? "opacity-80" : "text-muted-foreground"}>
                {i === 0 ? t("today") : i === 1 ? t("tomorrow") : l.weekday}
              </span>
              <span className="font-display text-xl font-extrabold">{l.day}</span>
              <span className={on ? "opacity-80" : "text-muted-foreground"}>{l.month}</span>
            </button>
          );
        })}
      </div>

      {availability.data && availability.data.resources.length > 1 && (
        <div className="flex gap-1 rounded-xl bg-surface p-1" role="tablist">
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
                "pressable min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-sm font-semibold",
                i === courtIndex ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
              )}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {availability.isPending && (
        <ul
          className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3"
          aria-label={t("loading")}
        >
          {Array.from({ length: 9 }, (_, i) => (
            <li key={i} className="skeleton h-14" />
          ))}
        </ul>
      )}
      {court && court.slots.length === 0 && (
        <p className="rounded-xl bg-surface p-4 text-center text-sm text-muted-foreground">
          {t("noSlots")}
        </p>
      )}
      {court && court.slots.length > 0 && (
        <>
          <ul
            className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3"
            key={`${date}-${courtIndex}`}
          >
            {court.slots.map((s, i) => {
              const isSelected = selected.includes(s.startTime);
              const open = s.status === "available";
              return (
                <li
                  key={s.startTime}
                  className="animate-scale-in"
                  style={{ "--i": Math.min(i, 12) } as React.CSSProperties}
                >
                  <button
                    type="button"
                    disabled={!open}
                    aria-pressed={isSelected}
                    onClick={() => tap(s)}
                    className={cn(
                      "pressable relative flex h-14 w-full flex-col items-center justify-center rounded-xl border text-sm",
                      open && !isSelected && "bg-card hover:border-primary hover:bg-primary-soft",
                      isSelected && "border-primary bg-primary text-primary-foreground shadow-lift",
                      !open &&
                        "cursor-not-allowed border-transparent bg-[repeating-linear-gradient(135deg,var(--accent)_0_6px,transparent_6px_12px)] text-muted-foreground",
                    )}
                  >
                    {isSelected && (
                      <span className="animate-pop absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-energy text-[11px] text-energy-foreground shadow">
                        ✓
                      </span>
                    )}
                    <span className={cn("font-bold", !open && "line-through")}>{s.startTime}</span>
                    <span
                      className={cn(
                        "text-[11px]",
                        isSelected ? "opacity-90" : open ? "text-muted-foreground" : "",
                      )}
                    >
                      {open && s.pricePaise !== null ? formatPaise(s.pricePaise) : t(s.status)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border bg-card" />
              {t("available")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-primary" />
              {t("selected")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-[repeating-linear-gradient(135deg,var(--border)_0_3px,transparent_3px_6px)]" />
              {t("taken")}
            </span>
          </div>
          {picked.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("selectHint")}</p>
          )}
        </>
      )}

      {picked.length > 0 && (
        <form
          onSubmit={submit}
          className="animate-scale-in space-y-4 rounded-2xl bg-surface p-4"
          noValidate
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-primary-strong uppercase">{t("yourSlot")}</p>
              <p className="font-display text-lg font-extrabold">
                {t("summary", {
                  count: picked.length,
                  start: picked[0]!.startTime,
                  end: picked.at(-1)!.endTime,
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="pressable shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              {t("clear")}
            </button>
          </div>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("total")}</dt>
              <dd>{formatPaise(amount.totalPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("advance")}</dt>
              <dd>{formatPaise(amount.advancePaise)}</dd>
            </div>
            {amount.convenienceFeePaise > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("fee")}</dt>
                <dd>{formatPaise(amount.convenienceFeePaise)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <dt>{t("payNow")}</dt>
              <dd>{formatPaise(payNow)}</dd>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <dt>{t("balance")}</dt>
              <dd>{formatPaise(amount.balancePaise)}</dd>
            </div>
          </dl>
          {me.data ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
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
                    placeholder="98765 43210"
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
              <Button type="submit" size="lg" className="w-full" disabled={hold.isPending}>
                {hold.isPending
                  ? t("holding")
                  : amount.advancePaise > 0
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
        <p
          role="alert"
          className="animate-fade-in rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}
    </section>
  );
}

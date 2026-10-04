"use client";

import {
  OWNER_BOOKING_SOURCES,
  addDays,
  bookingSchema,
  calendarSchema,
  customerSchema,
  formatPaise,
  istDate,
  timeToMinutes,
  type Booking,
  type BookingSource,
  type ResourceAvailability,
  type Slot,
} from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState, type FormEvent } from "react";
import { z } from "zod";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useVenueLive } from "@/hooks/use-venue-live";
import { api } from "@/lib/api";
import { longDate } from "@/lib/dates";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const PX_PER_MIN = 1; // a 60-minute slot is 60px tall

/** Blocks and coaching-batch reservations carry no money. */
const unpaid = (source: BookingSource) => source === "block" || source === "batch";

function tone(b: Booking): string {
  if (b.status === "pending_payment") return "bg-amber-100 border-amber-400 text-amber-950";
  if (b.status === "no_show") return "bg-red-100 border-red-400 text-red-950";
  if (b.status === "completed") return "bg-accent border-border text-muted-foreground";
  const bySource: Record<BookingSource, string> = {
    online: "bg-green-100 border-green-500 text-green-950",
    walkin: "bg-sky-100 border-sky-500 text-sky-950",
    phone: "bg-indigo-100 border-indigo-500 text-indigo-950",
    block: "bg-neutral-200 border-neutral-500 text-neutral-800",
    batch: "bg-purple-100 border-purple-500 text-purple-950",
  };
  return bySource[b.source];
}

function AddBookingForm({
  venueId,
  date,
  court,
  slot,
  onDone,
}: {
  venueId: string;
  date: string;
  court: ResourceAvailability;
  slot: Slot;
  onDone: () => void;
}) {
  const t = useTranslations("calendar");
  const queryClient = useQueryClient();
  const [source, setSource] = useState<(typeof OWNER_BOOKING_SOURCES)[number]>("walkin");
  const [count, setCount] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [clientError, setClientError] = useState<unknown>(null);

  // Free slots that follow the chosen one without a gap.
  const start = court.slots.findIndex((s) => s.startTime === slot.startTime);
  let maxCount = 0;
  for (
    let i = start;
    i < court.slots.length &&
    court.slots[i]!.status !== "taken" &&
    court.slots[i]!.status !== "past";
    i++
  ) {
    maxCount++;
  }

  const create = useMutation({
    mutationFn: (body: unknown) =>
      api.send("POST", `/venues/${venueId}/bookings`, bookingSchema, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar", venueId, date] });
      onDone();
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const startTimes = court.slots.slice(start, start + count).map((s) => s.startTime);
    let customer: z.infer<typeof customerSchema> | undefined;
    if (source !== "block") {
      const parsed = customerSchema.safeParse({ name, phone });
      if (!parsed.success) return setClientError(parsed.error);
      customer = parsed.data;
    }
    setClientError(null);
    create.mutate({
      resourceId: court.resourceId,
      date,
      startTimes,
      source,
      ...(customer ? { customer } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <p className="text-sm text-muted-foreground">
        {court.name} · {slot.startTime}
      </p>
      <div className="grid grid-cols-3 gap-1" role="radiogroup">
        {OWNER_BOOKING_SOURCES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={source === s}
            onClick={() => setSource(s)}
            className={cn(
              "rounded-md border px-2 py-2 text-sm",
              source === s && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {t(s)}
          </button>
        ))}
      </div>
      <Field label={t("time")}>
        <Select value={count} onChange={(e) => setCount(Number(e.target.value))}>
          {Array.from({ length: Math.max(1, Math.min(maxCount, 8)) }, (_, i) => i + 1).map((n) => {
            const last = court.slots[start + n - 1];
            return (
              <option key={n} value={n}>
                {slot.startTime}–{last?.endTime}
              </option>
            );
          })}
        </Select>
      </Field>
      {source !== "block" && (
        <>
          <Field label={t("customerName")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t("customerPhone")}>
            <Input
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
        </>
      )}
      <Field label={t("note")}>
        <Input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <FormError
        error={clientError ?? create.error}
        labels={{ name: t("customerName"), phone: t("customerPhone") }}
      />
      <Button type="submit" size="lg" className="w-full" disabled={create.isPending}>
        {t("save")}
      </Button>
    </form>
  );
}

function BookingDetails({
  booking,
  venueId,
  date,
  onDone,
}: {
  booking: Booking;
  venueId: string;
  date: string;
  onDone: () => void;
}) {
  const t = useTranslations("calendar");
  const tb = useTranslations("bookings");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const act = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown }) =>
      api.send("POST", `/bookings/${booking.id}/${path}`, bookingSchema, body ?? {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar", venueId, date] });
      onDone();
    },
  });
  const [openedAt] = useState(() => Date.now());
  const started = Date.parse(`${booking.date}T${booking.startTime}:00+05:30`) <= openedAt;
  const active = booking.status === "confirmed" || booking.status === "pending_payment";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">
          {booking.resource.name} · {booking.startTime}–{booking.endTime}
        </p>
        <BookingStatusBadge status={booking.status} />
      </div>
      <p className="text-sm text-muted-foreground">
        {tb(`source.${booking.source}`)} · {tb("code")} {booking.code}
      </p>
      {booking.customer && (
        <p>
          {booking.customer.name} ·{" "}
          <a className="underline" href={`tel:+91${booking.customer.phone}`}>
            {booking.customer.phone}
          </a>
        </p>
      )}
      {booking.note && <p className="text-sm">{booking.note}</p>}
      {booking.customer && booking.status === "confirmed" && (
        <a
          className="block text-sm text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
          href={waLink(
            booking.customer.phone,
            t("waToCustomer", {
              name: booking.customer.name,
              venue: booking.venue.name,
              court: booking.resource.name,
              date: longDate(booking.date, locale),
              start: booking.startTime,
              end: booking.endTime,
              code: booking.code,
              balance: formatPaise(booking.balanceCollected.method ? 0 : booking.balanceDuePaise),
            }),
          )}
        >
          {t("whatsapp")}
        </a>
      )}
      {!unpaid(booking.source) && (
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>{tb("paidAdvance")}</dt>
            <dd>{formatPaise(booking.amount.advancePaise)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>
              {booking.balanceCollected.method
                ? tb("balancePaid", { method: tb(`method.${booking.balanceCollected.method}`) })
                : tb("balanceDue")}
            </dt>
            <dd>{formatPaise(booking.amount.balancePaise)}</dd>
          </div>
          {booking.sharesPaidPaise > 0 && (
            <>
              <div className="flex justify-between">
                <dt>{tb("sharesPaid")}</dt>
                <dd>{formatPaise(booking.sharesPaidPaise)}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>{tb("balanceDueShares")}</dt>
                <dd>{formatPaise(booking.balanceDuePaise)}</dd>
              </div>
            </>
          )}
        </dl>
      )}
      <div className="flex flex-wrap gap-2">
        {!unpaid(booking.source) &&
          booking.status === "confirmed" &&
          !booking.balanceCollected.method && (
            <>
              <Button
                size="sm"
                disabled={act.isPending}
                onClick={() => act.mutate({ path: "balance", body: { method: "cash" } })}
              >
                {t("collected")} · {t("cash")}
              </Button>
              <Button
                size="sm"
                disabled={act.isPending}
                onClick={() => act.mutate({ path: "balance", body: { method: "upi" } })}
              >
                {t("collected")} · {t("upi")}
              </Button>
            </>
          )}
        {booking.status === "confirmed" && started && !unpaid(booking.source) && (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={act.isPending}
              onClick={() => act.mutate({ path: "complete" })}
            >
              {t("complete")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={act.isPending}
              onClick={() => act.mutate({ path: "no-show" })}
            >
              {t("noShow")}
            </Button>
          </>
        )}
        {active && (
          <Button
            size="sm"
            variant="ghost"
            disabled={act.isPending}
            onClick={() => act.mutate({ path: "cancel" })}
          >
            {t("cancel")}
          </Button>
        )}
      </div>
      <FormError error={act.error} labels={{}} />
    </div>
  );
}

export function CalendarBoard({ venueId }: { venueId: string }) {
  const t = useTranslations("calendar");
  const tc = useTranslations("common");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => istDate());
  const [adding, setAdding] = useState<{ court: ResourceAvailability; slot: Slot } | null>(null);
  const [viewing, setViewing] = useState<Booking | null>(null);

  const calendar = useQuery({
    queryKey: ["calendar", venueId, date],
    queryFn: () => api.get(`/venues/${venueId}/calendar?date=${date}`, calendarSchema),
  });
  const live = useVenueLive(
    venueId,
    useCallback(
      (e) => {
        void queryClient.invalidateQueries({ queryKey: ["calendar", venueId, e.date] });
      },
      [queryClient, venueId],
    ),
  );

  const data = calendar.data;
  const dayStart = data
    ? Math.min(
        ...data.resources.flatMap((r) => r.slots.map((s) => timeToMinutes(s.startTime))),
        24 * 60,
      )
    : 0;
  const dayEnd = data
    ? Math.max(...data.resources.flatMap((r) => r.slots.map((s) => timeToMinutes(s.endTime))), 0)
    : 0;
  const hours: number[] = [];
  for (let m = Math.ceil(dayStart / 60) * 60; m < dayEnd; m += 60) hours.push(m);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-label={t("prevDay")}
          onClick={() => setDate(addDays(date, -1))}
        >
          ‹
        </Button>
        <label className="flex-1 text-center">
          <span className="block text-sm font-medium">{longDate(date, locale)}</span>
          <input
            type="date"
            className="sr-only"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </label>
        <Button
          variant="outline"
          size="sm"
          aria-label={t("nextDay")}
          onClick={() => setDate(addDays(date, 1))}
        >
          ›
        </Button>
      </div>
      <p className={cn("text-xs", live ? "text-primary" : "text-muted-foreground")}>
        {live ? `● ${t("live")}` : t("offline")}
      </p>

      {calendar.isPending && <p className="text-muted-foreground">{tc("loading")}</p>}
      {calendar.isError && <p className="text-destructive">{tc("error")}</p>}
      {data && data.resources.length === 0 && (
        <p className="text-muted-foreground">{t("noCourts")}</p>
      )}

      {data && data.resources.length > 0 && dayEnd > dayStart && (
        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex min-w-max gap-2">
            <div
              className="relative w-10 shrink-0 pt-8"
              style={{ height: (dayEnd - dayStart) * PX_PER_MIN + 32 }}
            >
              {hours.map((m) => (
                <span
                  key={m}
                  className="absolute right-1 -translate-y-2 text-[10px] text-muted-foreground"
                  style={{ top: 32 + (m - dayStart) * PX_PER_MIN }}
                >
                  {String(m / 60).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            {data.resources.map((court) => {
              const bookings = data.bookings.filter((b) => b.resource.id === court.resourceId);
              return (
                <div key={court.resourceId} className="w-32 shrink-0">
                  <p className="h-8 truncate text-sm font-medium">{court.name}</p>
                  <div
                    className="relative border-l"
                    style={{ height: (dayEnd - dayStart) * PX_PER_MIN }}
                  >
                    {court.slots.map((s) => {
                      const top = (timeToMinutes(s.startTime) - dayStart) * PX_PER_MIN;
                      const height = court.slotDurationMins * PX_PER_MIN;
                      const booking = bookings.find((b) => b.slots.includes(s.startTime));
                      if (booking) {
                        if (booking.slots[0] !== s.startTime) return null;
                        return (
                          <button
                            key={s.startTime}
                            type="button"
                            onClick={() => setViewing(booking)}
                            className={cn(
                              "absolute inset-x-0.5 overflow-hidden rounded-md border-l-4 p-1 text-left text-xs",
                              tone(booking),
                            )}
                            style={{ top, height: height * booking.slots.length - 2 }}
                          >
                            <span className="block font-medium">
                              {booking.startTime}–{booking.endTime}
                            </span>
                            <span className="block truncate">
                              {booking.customer?.name ?? booking.note ?? t("block")}
                            </span>
                          </button>
                        );
                      }
                      const free = s.status === "available" || s.status === "unpriced";
                      return (
                        <button
                          key={s.startTime}
                          type="button"
                          disabled={!free}
                          onClick={() => setAdding({ court, slot: s })}
                          className={cn(
                            "absolute inset-x-0.5 rounded-md border border-dashed text-left text-[11px] text-muted-foreground",
                            free ? "hover:bg-accent" : "bg-accent/50",
                          )}
                          style={{ top, height: height - 2 }}
                        >
                          <span className="p-1">{s.startTime}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={adding !== null} onClose={() => setAdding(null)} title={t("addTitle")}>
        {adding && (
          <AddBookingForm
            venueId={venueId}
            date={date}
            court={adding.court}
            slot={adding.slot}
            onDone={() => setAdding(null)}
          />
        )}
      </Dialog>
      <Dialog open={viewing !== null} onClose={() => setViewing(null)} title={t("details")}>
        {viewing && (
          <BookingDetails
            booking={viewing}
            venueId={venueId}
            date={date}
            onDone={() => setViewing(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

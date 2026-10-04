"use client";

import {
  SKILL_LEVELS,
  bookingSharesSchema,
  formatPaise,
  gameSchema,
  openGameRequestSchema,
  rupeesToPaise,
  splitRequestSchema,
  type Booking,
  type SkillLevel,
} from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FormError } from "@/components/form-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { clientEnv } from "@/env";
import { api } from "@/lib/api";
import { longDate } from "@/lib/dates";
import { waShareLink } from "@/lib/whatsapp";

function OpenGameForm({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const t = useTranslations();
  const [spots, setSpots] = useState("4");
  const [rupees, setRupees] = useState("0");
  const [skill, setSkill] = useState<SkillLevel>("any");
  const [note, setNote] = useState("");
  const [clientError, setClientError] = useState<unknown>(null);
  const create = useMutation({
    mutationFn: (body: unknown) =>
      api.send("POST", `/bookings/${booking.id}/open-game`, gameSchema, body),
    onSuccess: onDone,
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = openGameRequestSchema.safeParse({
      skillLevel: skill,
      spotsNeeded: Number(spots || 0),
      pricePerHeadPaise: rupeesToPaise(Number(rupees || 0)),
      ...(note.trim() ? { note: note.trim() } : {}),
    });
    if (!parsed.success) return setClientError(parsed.error);
    setClientError(null);
    create.mutate(parsed.data);
  }
  return (
    <form onSubmit={submit} className="space-y-2" noValidate>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("sharing.spotsNeeded")}>
          <Input
            inputMode="numeric"
            value={spots}
            onChange={(e) => setSpots(e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Field label={t("sharing.pricePerHead")}>
          <Input inputMode="decimal" value={rupees} onChange={(e) => setRupees(e.target.value)} />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("sharing.priceHelp", { balance: formatPaise(booking.balanceDuePaise) })}
      </p>
      <Field label={t("sharing.skillLevel")}>
        <Select value={skill} onChange={(e) => setSkill(e.target.value as SkillLevel)}>
          {SKILL_LEVELS.map((s) => (
            <option key={s} value={s}>
              {t(`games.skill.${s}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("sharing.note")}>
        <Input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <FormError
        error={clientError ?? create.error}
        labels={{
          spotsNeeded: t("sharing.spotsNeeded"),
          pricePerHeadPaise: t("sharing.pricePerHead"),
        }}
      />
      <Button type="submit" disabled={create.isPending}>
        {t("sharing.create")}
      </Button>
    </form>
  );
}

function SplitForm({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const t = useTranslations("sharing");
  const [people, setPeople] = useState([
    { name: "", phone: "" },
    { name: "", phone: "" },
  ]);
  const [clientError, setClientError] = useState<unknown>(null);
  const create = useMutation({
    mutationFn: (body: unknown) =>
      api.send("POST", `/bookings/${booking.id}/split`, bookingSharesSchema, body),
    onSuccess: onDone,
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = splitRequestSchema.safeParse({
      shares: people.map((p) => ({ name: p.name, ...(p.phone ? { phone: p.phone } : {}) })),
    });
    if (!parsed.success) return setClientError(parsed.error);
    setClientError(null);
    create.mutate(parsed.data);
  }
  return (
    <form onSubmit={submit} className="space-y-2" noValidate>
      <p className="text-sm">{t("splitHelp", { balance: formatPaise(booking.balanceDuePaise) })}</p>
      <p className="text-xs font-medium">{t("splitPolicy")}</p>
      {people.map((p, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <Field label={t("friendName")}>
            <Input
              value={p.name}
              onChange={(e) =>
                setPeople((all) =>
                  all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                )
              }
            />
          </Field>
          <Field label={t("friendPhone")}>
            <Input
              inputMode="numeric"
              maxLength={10}
              value={p.phone}
              onChange={(e) =>
                setPeople((all) =>
                  all.map((x, j) =>
                    j === i ? { ...x, phone: e.target.value.replace(/\D/g, "") } : x,
                  ),
                )
              }
            />
          </Field>
          {people.length > 2 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={t("removeFriend")}
              onClick={() => setPeople((all) => all.filter((_, j) => j !== i))}
            >
              ×
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={people.length >= 20}
        onClick={() => setPeople((all) => [...all, { name: "", phone: "" }])}
      >
        {t("addFriend")}
      </Button>
      <FormError error={clientError ?? create.error} labels={{ shares: t("friendName") }} />
      <Button type="submit" disabled={create.isPending}>
        {t("createSplit")}
      </Button>
    </form>
  );
}

/** On a confirmed online booking: open it as a game, or split the venue balance with friends. */
export function SharingPanel({ booking }: { booking: Booking }) {
  const t = useTranslations("sharing");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"none" | "game" | "split">("none");
  const shares = useQuery({
    queryKey: ["shares", booking.id],
    queryFn: () => api.get(`/bookings/${booking.id}/shares`, bookingSharesSchema),
    enabled: booking.split,
  });
  const refresh = () => {
    setMode("none");
    void queryClient.invalidateQueries({ queryKey: ["booking", booking.id] });
    void queryClient.invalidateQueries({ queryKey: ["shares", booking.id] });
  };

  if (booking.openGameId) {
    return (
      <Link
        href={`/games/${booking.openGameId}`}
        className={buttonVariants({ variant: "outline", className: "w-full" })}
      >
        {t("viewGame")}
      </Link>
    );
  }

  if (booking.split && shares.data) {
    const s = shares.data;
    return (
      <section className="space-y-2 rounded-lg border p-3">
        <h2 className="font-semibold">{t("split")}</h2>
        <p className="text-sm">{t("sharesPaid", { amount: formatPaise(s.sharesPaidPaise) })}</p>
        <p className="text-sm font-medium">
          {t("balanceDue", { amount: formatPaise(s.balanceDuePaise) })}
        </p>
        <p className="text-xs text-muted-foreground">{t("splitPolicy")}</p>
        <ul className="divide-y text-sm">
          {s.shares.map((share) => {
            const url = `${clientEnv.NEXT_PUBLIC_SITE_URL}/pay/${share.token ?? ""}`;
            const text = t("waShare", {
              name: share.name,
              venue: booking.venue.name,
              date: longDate(booking.date, locale),
              start: booking.startTime,
              amount: formatPaise(share.amountPaise + share.feePaise),
              url,
            });
            return (
              <li key={share.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  {share.name} · {formatPaise(share.amountPaise)}
                  <span className="block text-xs text-muted-foreground">
                    {t(`shareStatus.${share.status}`)}
                  </span>
                </span>
                {share.token && share.status === "pending" && (
                  <a
                    href={waShareLink(text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    {t("shareLink")}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  if (booking.status !== "confirmed" || booking.source !== "online" || booking.balanceDuePaise <= 0)
    return null;

  return (
    <section className="space-y-3 rounded-lg border p-3">
      <h2 className="font-semibold">{t("title")}</h2>
      {mode === "none" && (
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => setMode("game")}>
            {t("openGame")}
          </Button>
          <Button variant="outline" onClick={() => setMode("split")}>
            {t("split")}
          </Button>
        </div>
      )}
      {mode === "game" && <OpenGameForm booking={booking} onDone={refresh} />}
      {mode === "split" && <SplitForm booking={booking} onDone={refresh} />}
    </section>
  );
}

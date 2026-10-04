"use client";

import { customerSchema, formatPaise, gameSchema, type Game } from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { use, useState, type FormEvent } from "react";
import { PayPanel } from "@/components/booking/pay-panel";
import { FormError } from "@/components/form-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/use-me";
import { useNow } from "@/hooks/use-now";
import { clientEnv } from "@/env";
import { api } from "@/lib/api";
import { longDate } from "@/lib/dates";
import { eventWhen } from "@/lib/event-time";
import { googleMapsUrl } from "@/lib/maps";
import { waShareLink } from "@/lib/whatsapp";

function HostControls({
  game,
  now,
  onChange,
}: {
  game: Game;
  now: number;
  onChange: (g: Game) => void;
}) {
  const t = useTranslations("games");
  const act = useMutation({
    mutationFn: (what: "cancel" | "keep") =>
      api.send("POST", `/games/${game.id}/${what}`, gameSchema),
    onSuccess: onChange,
  });
  const afterCutoff = Date.parse(game.joinCutoffAt) <= now;
  if (!["open", "full"].includes(game.status)) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {afterCutoff && game.status === "open" && (
        <Button disabled={act.isPending} onClick={() => act.mutate("keep")}>
          {t("keepGame")}
        </Button>
      )}
      <Button variant="outline" disabled={act.isPending} onClick={() => act.mutate("cancel")}>
        {t("cancelGame")}
      </Button>
      <FormError error={act.error} labels={{}} />
    </div>
  );
}

function GameView({ id }: { id: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const me = useMe();
  const now = useNow();
  const queryClient = useQueryClient();
  const game = useQuery({
    queryKey: ["game", id],
    queryFn: () => api.get(`/games/${id}`, gameSchema),
    refetchInterval: (q) => (q.state.data?.myShare?.status === "held" ? 5000 : 30_000),
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [clientError, setClientError] = useState<unknown>(null);
  const set = (g: Game) => queryClient.setQueryData(["game", id], g);
  const join = useMutation({
    mutationFn: (body: unknown) => api.send("POST", `/games/${id}/join`, gameSchema, body),
    onSuccess: set,
  });
  const leave = useMutation({
    mutationFn: () => api.send("POST", `/games/${id}/leave`, gameSchema),
    onSuccess: set,
  });

  if (game.isPending) return <p className="pt-6 text-muted-foreground">{t("common.loading")}</p>;
  if (game.isError) return <p className="pt-6 text-destructive">{t("common.error")}</p>;
  const g = game.data;
  const url = `${clientEnv.NEXT_PUBLIC_SITE_URL}/games/${g.id}`;
  const shareText = t("games.shareText", {
    sport: t(`sports.${g.sport}`),
    venue: g.venueName,
    date: longDate(g.date, locale),
    start: g.startTime,
    end: g.endTime,
    spots: g.spotsLeft,
    url,
  });
  const joinOpen = g.status === "open" && Date.parse(g.joinCutoffAt) > now;
  const mine = g.myShare && ["held", "paid"].includes(g.myShare.status) ? g.myShare : null;

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = customerSchema.safeParse({ name: name.trim() || me.data?.name || "", phone });
    if (!parsed.success) return setClientError(parsed.error);
    setClientError(null);
    join.mutate(parsed.data);
  }

  return (
    <article className="space-y-5 pt-4">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-3xl font-extrabold">
            {t(`sports.${g.sport}`)} · {t(`games.skill.${g.skillLevel}`)}
          </h1>
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs">
            {t(`games.statusText.${g.status}`)}
          </span>
        </div>
        <p>
          {longDate(g.date, locale)} · {g.startTime}–{g.endTime}
        </p>
        <p className="text-sm text-muted-foreground">
          {g.venueName} · {g.courtName} · {t("games.hostedBy", { name: g.hostFirstName })}
        </p>
      </header>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border p-2">
          <p className="text-3xl font-extrabold text-primary">{g.spotsLeft}</p>
          <p className="text-xs text-muted-foreground">
            {t("games.spotsLeft", { count: g.spotsLeft })}
          </p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-3xl font-extrabold">
            {g.pricePerHeadPaise > 0 ? formatPaise(g.pricePerHeadPaise) : "₹0"}
          </p>
          <p className="text-xs text-muted-foreground">
            {g.pricePerHeadPaise > 0 ? t("games.perHead", { price: "" }).trim() : t("games.free")}
          </p>
        </div>
      </div>
      {g.note && <p className="whitespace-pre-line text-sm">{g.note}</p>}
      <p className="text-xs text-muted-foreground">
        {t("games.cutoffNote", { time: eventWhen(g.joinCutoffAt, locale) })}
      </p>

      {mine?.status === "paid" && (
        <p className="rounded-md bg-green-100 p-3 text-sm text-green-900">{t("games.joined")}</p>
      )}
      {mine?.status === "held" && (
        <div className="space-y-2 rounded-lg border border-amber-300 p-3">
          <p className="text-sm font-medium">
            {t("games.heldPay", {
              minutes: Math.max(
                0,
                Math.ceil((Date.parse(mine.holdExpiresAt ?? "") - now) / 60_000),
              ),
            })}
          </p>
          <PayPanel
            target={{ shareId: mine.id }}
            amountPaise={g.pricePerHeadPaise}
            description={`${g.venueName} · ${g.date} ${g.startTime}`}
            onPaid={() => void game.refetch()}
          />
        </div>
      )}
      {mine && joinOpen && (
        <Button variant="ghost" size="sm" disabled={leave.isPending} onClick={() => leave.mutate()}>
          {t("games.leave")}
        </Button>
      )}

      {!g.isHost &&
        !mine &&
        (joinOpen ? (
          me.data ? (
            <form
              onSubmit={submit}
              className="space-y-3 rounded-2xl border bg-card p-4 shadow-card"
              noValidate
            >
              <Field label={t("games.yourName")}>
                <Input
                  autoComplete="name"
                  value={name}
                  placeholder={me.data.name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label={t("games.phone")}>
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <FormError
                error={clientError ?? join.error}
                labels={{ name: t("games.yourName"), phone: t("games.phone") }}
              />
              <Button type="submit" size="lg" className="w-full" disabled={join.isPending}>
                {g.pricePerHeadPaise > 0
                  ? `${t("games.join")} · ${formatPaise(g.pricePerHeadPaise)}`
                  : t("games.joinFree")}
              </Button>
            </form>
          ) : (
            <Link href="/sign-in" className={buttonVariants({ size: "lg", className: "w-full" })}>
              {t("games.signIn")}
            </Link>
          )
        ) : (
          <p className="text-sm text-muted-foreground">{t("games.closed")}</p>
        ))}

      {g.isHost && (
        <section className="space-y-3">
          <h2 className="font-semibold">{t("games.players")}</h2>
          {g.players?.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("games.noPlayers")}</p>
          )}
          <ul className="divide-y text-sm">
            {g.players?.map((p) => (
              <li key={p.shareId} className="flex justify-between py-2">
                <span>{p.name}</span>
                <a href={`tel:+91${p.phone}`} className="underline">
                  {p.phone}
                </a>
              </li>
            ))}
          </ul>
          <HostControls game={g} now={now} onChange={set} />
        </section>
      )}

      <div className="grid grid-cols-2 gap-2">
        <a
          href={waShareLink(shareText)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants()}
        >
          {t("games.share")}
        </a>
        <a
          href={googleMapsUrl(g.location)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          {t("games.directions")}
        </a>
      </div>
      <Link
        href={`/${g.citySlug}/venues/${g.venueSlug}`}
        className={buttonVariants({ variant: "link" })}
      >
        {t("games.venue")}
      </Link>
    </article>
  );
}

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <GameView id={id} />;
}

"use client";

import { eventSchema, type Event } from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { z } from "zod";
import { AuthGate } from "@/components/auth-gate";
import { FormError } from "@/components/form-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { eventWhen } from "@/lib/event-time";

function Row({ event }: { event: Event }) {
  const t = useTranslations("ownerEvents");
  const ts = useTranslations("owner.status");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const submit = useMutation({
    mutationFn: () => api.send("POST", `/events/${event.id}/submit`, eventSchema),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });
  return (
    <li className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{event.title}</p>
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs">{ts(event.status)}</span>
      </div>
      <p className="text-sm text-muted-foreground">{eventWhen(event.startsAt, locale)}</p>
      {event.reviewNote && <p className="text-sm text-destructive">{event.reviewNote}</p>}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/owner/events/${event.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("edit")}
        </Link>
        {event.status === "published" && (
          <>
            <Link
              href={`/owner/events/${event.id}/dashboard`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("dashboard")}
            </Link>
            <Link
              href={`/owner/events/${event.id}/checkin`}
              className={buttonVariants({ size: "sm" })}
            >
              {t("checkin")}
            </Link>
          </>
        )}
        {event.status === "draft" && (
          <Button size="sm" disabled={submit.isPending} onClick={() => submit.mutate()}>
            {t("submit")}
          </Button>
        )}
      </div>
      <FormError error={submit.error} labels={{}} />
    </li>
  );
}

function List() {
  const t = useTranslations("ownerEvents");
  const events = useQuery({
    queryKey: ["events"],
    queryFn: () => api.get("/events/mine", z.array(eventSchema)),
  });
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link href="/owner/events/new" className={buttonVariants({ size: "sm" })}>
          {t("new")}
        </Link>
      </div>
      {events.data?.length === 0 && <p className="text-muted-foreground">{t("none")}</p>}
      <ul className="space-y-3">
        {events.data?.map((e) => (
          <Row key={e.id} event={e} />
        ))}
      </ul>
    </section>
  );
}

export default function OwnerEventsPage() {
  return <AuthGate>{() => <List />}</AuthGate>;
}

"use client";

import { businessSchema, venueSchema, type Venue } from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { AuthGate } from "@/components/auth-gate";
import { FormError } from "@/components/form-error";
import { BusinessForm } from "@/components/owner/business-form";
import { PushToggle } from "@/components/owner/push-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("owner.status");
  return <span className="rounded-full bg-accent px-2 py-0.5 text-xs">{t(status as "draft")}</span>;
}

function VenueRow({ venue }: { venue: Venue }) {
  const t = useTranslations("owner");
  const queryClient = useQueryClient();
  const submit = useMutation({
    mutationFn: () => api.send("POST", `/venues/${venue.id}/submit`, venueSchema),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["venues"] }),
  });
  return (
    <li className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{venue.name}</p>
        <StatusBadge status={venue.status} />
      </div>
      {venue.reviewNote && (
        <p className="text-sm text-destructive">{t("reviewNote", { note: venue.reviewNote })}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/owner/venues/${venue.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("edit")}
        </Link>
        <Link
          href={`/owner/venues/${venue.id}/calendar`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("calendar")}
        </Link>
        <Link
          href={`/owner/venues/${venue.id}/memberships`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("memberships")}
        </Link>
        <Link
          href={`/owner/venues/${venue.id}/courts`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("courts")}
        </Link>
        {(venue.status === "draft" || venue.status === "hidden") && (
          <Button size="sm" disabled={submit.isPending} onClick={() => submit.mutate()}>
            {t("submit")}
          </Button>
        )}
        {venue.status === "live" && (
          <Link
            href={`/${venue.citySlug}/venues/${venue.slug}`}
            className={buttonVariants({ variant: "link", size: "sm" })}
          >
            {t("view")}
          </Link>
        )}
      </div>
      {submit.isSuccess && <p className="text-sm text-primary">{t("submitted")}</p>}
      <FormError error={submit.error} labels={{}} />
    </li>
  );
}

function Dashboard() {
  const t = useTranslations("owner");
  const [editing, setEditing] = useState<string | null>(null);
  const businesses = useQuery({
    queryKey: ["businesses"],
    queryFn: () => api.get("/businesses/mine", z.array(businessSchema)),
  });
  const venues = useQuery({
    queryKey: ["venues"],
    queryFn: () => api.get("/venues/mine", z.array(venueSchema)),
  });

  if (businesses.isPending || venues.isPending) return null;
  if (businesses.isError || venues.isError)
    return <p className="text-destructive">{t("signInFirst")}</p>;

  if (businesses.data.length === 0) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">{t("listYourBusiness")}</h1>
        <p className="text-muted-foreground">{t("listIntro")}</p>
        <BusinessForm onDone={() => undefined} />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link href="/owner/events" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("events")}
        </Link>
      </div>
      <PushToggle />
      {businesses.data.map((b) => (
        <div key={b.id} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{b.name}</h2>
            <StatusBadge status={b.status} />
          </div>
          {b.reviewNote && (
            <p className="text-sm text-destructive">{t("reviewNote", { note: b.reviewNote })}</p>
          )}
          <Link
            href={`/owner/businesses/${b.id}/earnings`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("earnings")}
          </Link>
          {editing === b.id ? (
            <BusinessForm business={b} onDone={() => setEditing(null)} />
          ) : (
            <Button variant="link" size="sm" className="px-0" onClick={() => setEditing(b.id)}>
              {t("edit")}
            </Button>
          )}
          <ul className="space-y-3">
            {venues.data
              .filter((v) => v.businessId === b.id)
              .map((v) => (
                <VenueRow key={v.id} venue={v} />
              ))}
          </ul>
          <Link href={`/owner/venues/new?businessId=${b.id}`} className={buttonVariants()}>
            {t("addVenue")}
          </Link>
        </div>
      ))}
    </section>
  );
}

export default function OwnerPage() {
  return <AuthGate>{() => <Dashboard />}</AuthGate>;
}

"use client";

import { venueSchema } from "@townplay/shared";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { use } from "react";
import { AuthGate } from "@/components/auth-gate";
import { VenueForm } from "@/components/owner/venue-form";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";

function EditVenue({ id }: { id: string }) {
  const t = useTranslations();
  const venue = useQuery({
    queryKey: ["venues", id],
    queryFn: () => api.get(`/venues/${id}`, venueSchema),
  });
  if (venue.isPending) return <p className="text-muted-foreground">{t("common.loading")}</p>;
  if (venue.isError) return <p className="text-destructive">{t("common.error")}</p>;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t("venueForm.editTitle")}</h1>
      {venue.data.reviewNote && (
        <p className="text-sm text-destructive">
          {t("owner.reviewNote", { note: venue.data.reviewNote })}
        </p>
      )}
      <Link
        href={`/owner/venues/${id}/courts`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {t("owner.courts")}
      </Link>
      <VenueForm key={venue.data.updatedAt} venue={venue.data} onSaved={() => undefined} />
    </section>
  );
}

export default function EditVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate>{() => <EditVenue id={id} />}</AuthGate>;
}

"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGate } from "@/components/auth-gate";
import { VenueForm } from "@/components/owner/venue-form";

export default function NewVenuePage() {
  const t = useTranslations("venueForm");
  const router = useRouter();
  const businessId = useSearchParams().get("businessId") ?? "";
  return (
    <AuthGate>
      {() => (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">{t("newTitle")}</h1>
          <VenueForm
            businessId={businessId}
            onSaved={(v) => router.push(`/owner/venues/${v.id}/courts`)}
          />
        </section>
      )}
    </AuthGate>
  );
}

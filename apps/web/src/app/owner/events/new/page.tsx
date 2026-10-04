"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth-gate";
import { EventForm } from "@/components/owner/event-form";

export default function NewEventPage() {
  const t = useTranslations("ownerEvents");
  const router = useRouter();
  return (
    <AuthGate>
      {() => (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">{t("formNew")}</h1>
          <EventForm onSaved={(e) => router.push(`/owner/events/${e.id}`)} />
        </section>
      )}
    </AuthGate>
  );
}

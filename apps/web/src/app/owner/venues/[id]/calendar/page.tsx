"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { use } from "react";
import { AuthGate } from "@/components/auth-gate";
import { CalendarBoard } from "@/components/owner/calendar-board";
import { buttonVariants } from "@/components/ui/button";

export default function CalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  return (
    <AuthGate>
      {() => (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t("calendar.title")}</h1>
            <Link href="/owner" className={buttonVariants({ variant: "link", size: "sm" })}>
              {t("owner.title")}
            </Link>
          </div>
          <CalendarBoard venueId={id} />
        </section>
      )}
    </AuthGate>
  );
}

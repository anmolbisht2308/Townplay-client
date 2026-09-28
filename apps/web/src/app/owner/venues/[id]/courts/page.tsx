"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { use } from "react";
import { AuthGate } from "@/components/auth-gate";
import { CourtsEditor } from "@/components/owner/courts-editor";
import { buttonVariants } from "@/components/ui/button";

export default function CourtsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  return (
    <AuthGate>
      {() => (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">{t("courtForm.title")}</h1>
          <CourtsEditor venueId={id} />
          <Link href="/owner" className={buttonVariants({ variant: "link" })}>
            {t("owner.title")}
          </Link>
        </section>
      )}
    </AuthGate>
  );
}

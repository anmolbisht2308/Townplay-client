"use client";

import { membershipSchema } from "@townplay/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { z } from "zod";
import { AuthGate } from "@/components/auth-gate";
import { MembershipStatusBadge } from "@/components/memberships/status-badge";
import { api } from "@/lib/api";
import { longDate } from "@/lib/dates";

function List() {
  const t = useTranslations("memberships");
  const tc = useTranslations("common");
  const locale = useLocale();
  const list = useQuery({
    queryKey: ["memberships", "mine"],
    queryFn: () => api.get("/memberships/mine", z.array(membershipSchema)),
  });
  if (list.isPending) return <p className="text-muted-foreground">{tc("loading")}</p>;
  if (list.isError) return <p className="text-destructive">{tc("error")}</p>;
  return (
    <section className="space-y-4 pt-4">
      <h1 className="text-3xl font-extrabold">{t("mineTitle")}</h1>
      {list.data.length === 0 && <p className="text-muted-foreground">{t("empty")}</p>}
      <ul className="space-y-3">
        {list.data.map((m) => (
          <li key={m.id}>
            <Link
              href={`/memberships/${m.id}`}
              className="block space-y-1 rounded-2xl border bg-card p-4 shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{m.plan?.name ?? m.batch?.title}</p>
                <MembershipStatusBadge status={m.status} />
              </div>
              <p className="text-sm text-muted-foreground">{m.venue.name}</p>
              <p className="text-sm">
                {t("validity", {
                  from: longDate(m.startsOn, locale),
                  to: longDate(m.endsOn, locale),
                })}
              </p>
              {m.daysLeft !== null && (
                <p
                  className={
                    m.daysLeft <= 3 && m.renewable
                      ? "text-sm text-amber-700"
                      : "text-sm text-primary"
                  }
                >
                  {t("daysLeft", { count: m.daysLeft })}
                  {m.renewable && m.daysLeft <= 7 ? ` · ${t("renew")}` : ""}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MyMembershipsPage() {
  return <AuthGate>{() => <List />}</AuthGate>;
}

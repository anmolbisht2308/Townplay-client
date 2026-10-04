"use client";

import {
  batchSchema,
  formatPaise,
  memberRowSchema,
  membershipSchema,
  planSchema,
  type Batch,
  type Plan,
} from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { use, useState } from "react";
import { z } from "zod";
import { AuthGate } from "@/components/auth-gate";
import { daysLabel } from "@/components/memberships/schedule";
import { MembershipStatusBadge } from "@/components/memberships/status-badge";
import { BatchForm } from "@/components/owner/batch-form";
import { PlanForm } from "@/components/owner/plan-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { api } from "@/lib/api";
import { longDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Tab = "plans" | "batches" | "members";

function Plans({ venueId }: { venueId: string }) {
  const t = useTranslations("ownerMemberships");
  const tm = useTranslations("memberships");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState<Plan | "new" | null>(null);
  const plans = useQuery({
    queryKey: ["plans", venueId],
    queryFn: () => api.get(`/owner/venues/${venueId}/plans`, z.array(planSchema)),
  });
  if (editing)
    return (
      <PlanForm
        venueId={venueId}
        {...(editing === "new" ? {} : { plan: editing })}
        onDone={() => setEditing(null)}
      />
    );
  if (plans.isPending) return <p className="text-muted-foreground">{tc("loading")}</p>;
  if (plans.isError) return <p className="text-destructive">{tc("error")}</p>;
  return (
    <div className="space-y-3">
      <Button onClick={() => setEditing("new")}>{t("newPlan")}</Button>
      {plans.data.length === 0 && <p className="text-muted-foreground">{t("noPlans")}</p>}
      <ul className="space-y-2">
        {plans.data.map((p) => (
          <li key={p.id} className="flex items-start justify-between gap-2 rounded-lg border p-3">
            <div className="min-w-0">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatPaise(p.pricePaise)} · {tm("months", { count: p.durationMonths })} ·{" "}
                {p.discountPercent}%{p.bookingsPerMonth ? ` × ${p.bookingsPerMonth}` : ""}
              </p>
              <p className="text-xs">{p.isActive ? t("onSale") : t("notOnSale")}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
              {t("edit")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Batches({ venueId }: { venueId: string }) {
  const t = useTranslations("ownerMemberships");
  const tm = useTranslations("memberships");
  const tAll = useTranslations();
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Batch | "new" | null>(null);
  const batches = useQuery({
    queryKey: ["batches", venueId],
    queryFn: () => api.get(`/owner/venues/${venueId}/batches`, z.array(batchSchema)),
  });
  const end = useMutation({
    mutationFn: (id: string) => api.send("POST", `/owner/batches/${id}/end`, batchSchema),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["batches", venueId] }),
  });
  if (editing)
    return (
      <BatchForm
        venueId={venueId}
        {...(editing === "new" ? {} : { batch: editing })}
        onDone={() => setEditing(null)}
      />
    );
  if (batches.isPending) return <p className="text-muted-foreground">{tc("loading")}</p>;
  if (batches.isError) return <p className="text-destructive">{tc("error")}</p>;
  return (
    <div className="space-y-3">
      <Button onClick={() => setEditing("new")}>{t("newBatch")}</Button>
      {batches.data.length === 0 && <p className="text-muted-foreground">{t("noBatches")}</p>}
      <ul className="space-y-2">
        {batches.data.map((b) => (
          <li key={b.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold">{b.title}</p>
              {b.status === "ended" && (
                <span className="text-xs text-muted-foreground">{t("ended")}</span>
              )}
            </div>
            <p className="text-sm">
              {tm("schedule", {
                days: daysLabel(b.days, (k) => tAll(k as "venue.allDays")),
                start: b.startTime,
                end: b.endTime,
              })}
              {b.resourceName ? ` · ${b.resourceName}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {b.coachName} · {tm("perMonth", { amount: formatPaise(b.monthlyFeePaise) })} ·{" "}
              {t("seats", { taken: b.capacity - b.seatsLeft, capacity: b.capacity })}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/owner/batches/${b.id}/attendance`}
                className={buttonVariants({ size: "sm" })}
              >
                {t("attendance")}
              </Link>
              {b.status === "active" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditing(b)}>
                    {t("edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={end.isPending}
                    onClick={() => window.confirm(t("endConfirm")) && end.mutate(b.id)}
                  >
                    {t("endBatch")}
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Members({ venueId }: { venueId: string }) {
  const t = useTranslations("ownerMemberships");
  const tc = useTranslations("common");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"current" | "expired" | "all">("current");
  const members = useQuery({
    queryKey: ["members", venueId, status],
    queryFn: () =>
      api.get(`/owner/venues/${venueId}/members?status=${status}`, z.array(memberRowSchema)),
  });
  const cancel = useMutation({
    mutationFn: (id: string) =>
      api.send("POST", `/owner/memberships/${id}/cancel`, membershipSchema, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", venueId] }),
  });
  return (
    <div className="space-y-3">
      <Select
        value={status}
        onChange={(e) => setStatus(e.target.value as typeof status)}
        aria-label={t("tabs.members")}
      >
        {(["current", "expired", "all"] as const).map((s) => (
          <option key={s} value={s}>
            {t(`filter.${s}`)}
          </option>
        ))}
      </Select>
      {members.isPending && <p className="text-muted-foreground">{tc("loading")}</p>}
      {members.isError && <p className="text-destructive">{tc("error")}</p>}
      {members.data?.length === 0 && <p className="text-muted-foreground">{t("noMembers")}</p>}
      <ul className="divide-y rounded-lg border">
        {members.data?.map((m) => (
          <li key={m.id} className="space-y-1 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{m.member.name}</p>
              <MembershipStatusBadge status={m.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {m.name} · {longDate(m.startsOn, locale)} – {longDate(m.endsOn, locale)}
              {m.renewed ? ` · ${t("renewedTag")}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`tel:+91${m.member.phone}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {m.member.phone}
              </a>
              {m.status === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={cancel.isPending}
                  onClick={() =>
                    window.confirm(t("cancelConfirm", { name: m.member.name })) &&
                    cancel.mutate(m.id)
                  }
                >
                  {t("cancelMember")}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Page({ venueId }: { venueId: string }) {
  const t = useTranslations("ownerMemberships");
  const [tab, setTab] = useState<Tab>("plans");
  return (
    <section className="space-y-4 pt-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <nav className="flex gap-2" role="tablist">
        {(["plans", "batches", "members"] as const).map((x) => (
          <button
            key={x}
            role="tab"
            aria-selected={tab === x}
            onClick={() => setTab(x)}
            className={cn(
              "h-10 rounded-full border px-4 text-sm",
              tab === x ? "border-primary bg-primary text-primary-foreground" : "",
            )}
          >
            {t(`tabs.${x}`)}
          </button>
        ))}
      </nav>
      {tab === "plans" && <Plans venueId={venueId} />}
      {tab === "batches" && <Batches venueId={venueId} />}
      {tab === "members" && <Members venueId={venueId} />}
    </section>
  );
}

export default function OwnerMembershipsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate>{() => <Page venueId={id} />}</AuthGate>;
}

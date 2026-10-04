"use client";

import { formatPaise, istDate, membershipSchema } from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { AuthGate } from "@/components/auth-gate";
import { PayPanel } from "@/components/booking/pay-panel";
import { FormError } from "@/components/form-error";
import { daysLabel } from "@/components/memberships/schedule";
import { MembershipStatusBadge } from "@/components/memberships/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import { api } from "@/lib/api";
import { longDate } from "@/lib/dates";

function Detail({ id }: { id: string }) {
  const t = useTranslations("memberships");
  const tAll = useTranslations();
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const now = useNow(15_000);
  const m = useQuery({
    queryKey: ["memberships", id],
    queryFn: () => api.get(`/memberships/${id}`, membershipSchema),
    refetchInterval: (q) => (q.state.data?.status === "pending_payment" ? 5000 : false),
  });
  const renew = useMutation({
    mutationFn: () => api.send("POST", `/memberships/${id}/renew`, membershipSchema),
    onSuccess: async (next) => {
      await queryClient.invalidateQueries({ queryKey: ["memberships"] });
      router.push(`/memberships/${next.id}`);
    },
  });

  if (m.isPending) return <p className="text-muted-foreground">{tc("loading")}</p>;
  if (m.isError) return <p className="text-destructive">{tc("error")}</p>;
  const d = m.data;
  const title = d.plan?.name ?? d.batch?.title ?? "";
  const minutesLeft = d.holdExpiresAt
    ? Math.max(0, Math.ceil((Date.parse(d.holdExpiresAt) - now) / 60_000))
    : null;
  const holdLive = d.status === "pending_payment" && minutesLeft !== null && minutesLeft > 0;

  return (
    <article className="space-y-5 pt-4">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <MembershipStatusBadge status={d.status} />
        </div>
        <p className="text-muted-foreground">{d.venue.name}</p>
        {d.renewalOf && <p className="text-sm text-muted-foreground">{t("renewalOf")}</p>}
      </header>

      <dl className="space-y-1 rounded-lg border p-3 text-sm">
        <div className="flex justify-between gap-2">
          <dt>{t("member")}</dt>
          <dd className="text-right">
            {d.member.name} · {d.member.phone}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>{t("period")}</dt>
          <dd className="text-right">
            {t("validity", { from: longDate(d.startsOn, locale), to: longDate(d.endsOn, locale) })}
          </dd>
        </div>
        {d.plan && (
          <p className="text-muted-foreground">
            {t("months", { count: d.plan.durationMonths })}
            {d.plan.discountPercent > 0 &&
              ` · ${t("discount", { percent: d.plan.discountPercent })}, ${
                d.plan.bookingsPerMonth
                  ? t("perMonthCap", { count: d.plan.bookingsPerMonth })
                  : t("everyBooking")
              }`}
          </p>
        )}
        {d.batch && (
          <p className="text-muted-foreground">
            {t("schedule", {
              days: daysLabel(d.batch.days, (k) => tAll(k as "venue.allDays")),
              start: d.batch.startTime,
              end: d.batch.endTime,
            })}{" "}
            · {t("coach", { name: d.batch.coachName })}
          </p>
        )}
        <div className="flex justify-between">
          <dt>{t("price")}</dt>
          <dd>{formatPaise(d.pricePaise)}</dd>
        </div>
        {d.convenienceFeePaise > 0 && (
          <div className="flex justify-between">
            <dt>{t("fee")}</dt>
            <dd>{formatPaise(d.convenienceFeePaise)}</dd>
          </div>
        )}
      </dl>

      {d.status === "active" && d.startsOn > istDate() && (
        <p className="text-sm">{t("upcoming", { date: longDate(d.startsOn, locale) })}</p>
      )}
      {d.daysLeft !== null && d.startsOn <= istDate() && (
        <p className="font-medium text-primary">{t("daysLeft", { count: d.daysLeft })}</p>
      )}
      {d.bookingsUsedThisMonth !== null && d.plan?.bookingsPerMonth && (
        <p className="text-sm">
          {t("used", { used: d.bookingsUsedThisMonth, cap: d.plan.bookingsPerMonth })}
        </p>
      )}

      {holdLive && (
        <div className="space-y-3">
          <p className="text-sm text-amber-700">{t("payBy", { minutes: minutesLeft })}</p>
          <PayPanel
            target={{ membershipId: d.id }}
            amountPaise={d.pricePaise + d.convenienceFeePaise}
            description={`${title} · ${d.venue.name}`}
            phone={d.member.phone}
            onPaid={() => void m.refetch()}
          />
          <p className="text-xs text-muted-foreground">{t("noRefund")}</p>
        </div>
      )}
      {d.status === "pending_payment" && !holdLive && (
        <p className="text-destructive">{t("holdExpired")}</p>
      )}

      {d.renewedBy && (
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-sm">{t("renewed")}</p>
          <Link
            href={`/memberships/${d.renewedBy}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("viewRenewal")}
          </Link>
        </div>
      )}
      {d.renewable && (
        <div className="space-y-2">
          <Button className="w-full" disabled={renew.isPending} onClick={() => renew.mutate()}>
            {t("renewFor", { amount: formatPaise(d.pricePaise) })}
          </Button>
          <FormError error={renew.error} labels={{}} />
        </div>
      )}

      {d.status === "cancelled" && (
        <p className="text-sm text-destructive">{t("status.cancelled")}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <a
          href={`tel:+91${d.venue.contactPhone}`}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("callVenue")}
        </a>
        <Link
          href={`/${d.venue.citySlug}/venues/${d.venue.slug}`}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("viewVenue")}
        </Link>
      </div>
    </article>
  );
}

export default function MembershipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate>{() => <Detail id={id} />}</AuthGate>;
}

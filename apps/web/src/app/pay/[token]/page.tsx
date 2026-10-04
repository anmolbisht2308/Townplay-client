"use client";

import { formatPaise, orderResponseSchema, sharePageSchema } from "@townplay/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { use } from "react";
import { PayPanel } from "@/components/booking/pay-panel";
import { buttonVariants } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { api } from "@/lib/api";
import { longDate } from "@/lib/dates";

/** Split-payment link: a friend opens it from WhatsApp, signs in and pays their share. */
export default function PaySharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const t = useTranslations("payShare");
  const tc = useTranslations("common");
  const locale = useLocale();
  const me = useMe();
  const share = useQuery({
    queryKey: ["share-page", token],
    queryFn: () => api.get(`/shares/${token}`, sharePageSchema),
    refetchInterval: (q) => (q.state.data?.status === "held" ? 5000 : false),
  });
  if (share.isPending) return <p className="pt-6 text-muted-foreground">{tc("loading")}</p>;
  if (share.isError) return <p className="pt-6 text-destructive">{tc("error")}</p>;
  const s = share.data;
  const payable = s.status === "pending" || s.status === "held";
  const deadline = new Date(s.deadline).toLocaleString(locale, {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="mx-auto max-w-md space-y-5 pt-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("for", { name: s.name })}</p>
        <p className="font-medium">
          {s.venueName} · {s.courtName}
        </p>
        <p className="text-sm">
          {longDate(s.date, locale)} · {s.startTime}–{s.endTime}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("organisedBy", { name: s.organiserFirstName })}
        </p>
      </header>

      <dl className="space-y-1 rounded-2xl border bg-card p-4 shadow-card text-sm">
        <div className="flex justify-between">
          <dt>{t("amount")}</dt>
          <dd>{formatPaise(s.amountPaise)}</dd>
        </div>
        {s.feePaise > 0 && (
          <div className="flex justify-between">
            <dt>{t("fee")}</dt>
            <dd>{formatPaise(s.feePaise)}</dd>
          </div>
        )}
      </dl>

      {s.status === "paid" && <p className="font-medium text-green-700">{t("paid")}</p>}
      {!payable && s.status !== "paid" && <p className="text-destructive">{t("notPayable")}</p>}
      {payable && (
        <>
          <p className="text-sm text-muted-foreground">{t("deadline", { time: deadline })}</p>
          {me.data ? (
            <PayPanel
              target={{ shareId: s.id }}
              amountPaise={s.amountPaise + s.feePaise}
              description={`${s.venueName} · ${s.date} ${s.startTime}`}
              createOrder={() => api.send("POST", `/shares/${token}/order`, orderResponseSchema)}
              onPaid={() => void share.refetch()}
            />
          ) : (
            !me.isPending && (
              <Link href="/sign-in" className={buttonVariants({ className: "w-full" })}>
                {t("signIn")}
              </Link>
            )
          )}
        </>
      )}
    </article>
  );
}

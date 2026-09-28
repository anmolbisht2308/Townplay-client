"use client";

import {
  BUSINESS_STATUSES,
  VENUE_STATUSES,
  reviewQueueItemSchema,
  type ReviewQueueItem,
} from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { AuthGate } from "@/components/auth-gate";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Kind = ReviewQueueItem["kind"];
type Action = "approve" | "reject" | "suspend" | "hide";

function Item({ item }: { item: ReviewQueueItem }) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [needReason, setNeedReason] = useState(false);
  const act = useMutation({
    mutationFn: (action: Action) =>
      api.send(
        "POST",
        `/admin/${item.kind === "venue" ? "venues" : "businesses"}/${item.id}/${action}`,
        z.unknown(),
        action === "approve" ? undefined : { reason },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["review"] }),
  });
  const run = (action: Action) => {
    if (action !== "approve" && reason.trim().length < 3) return setNeedReason(true);
    setNeedReason(false);
    act.mutate(action);
  };
  const actions: Action[] =
    item.kind === "venue" ? ["approve", "reject", "hide"] : ["approve", "reject", "suspend"];

  return (
    <li className="space-y-2 rounded-lg border p-3">
      <div>
        <p className="font-medium">
          {item.kind === "venue" && item.status === "live" && item.citySlug && item.slug ? (
            <Link href={`/${item.citySlug}/venues/${item.slug}`} className="underline">
              {item.name}
            </Link>
          ) : (
            item.name
          )}
        </p>
        {item.kind === "venue" && (
          <p className="text-sm text-muted-foreground">
            {t("admin.by", { business: item.businessName })}
          </p>
        )}
        {item.reviewNote && (
          <p className="text-sm">{t("owner.reviewNote", { note: item.reviewNote })}</p>
        )}
      </div>
      <Field label={t("admin.reason")}>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      {needReason && <p className="text-sm text-destructive">{t("admin.reasonRequired")}</p>}
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a}
            size="sm"
            variant={a === "approve" ? "default" : "outline"}
            disabled={act.isPending}
            onClick={() => run(a)}
          >
            {t(`admin.${a}`)}
          </Button>
        ))}
      </div>
      <FormError error={act.error} labels={{}} />
    </li>
  );
}

function Queue() {
  const t = useTranslations();
  const [kind, setKind] = useState<Kind>("venue");
  const [status, setStatus] = useState("pending_review");
  const queue = useQuery({
    queryKey: ["review", kind, status],
    queryFn: () =>
      api.get(`/admin/review?kind=${kind}&status=${status}`, z.array(reviewQueueItemSchema)),
  });
  const statuses = kind === "venue" ? VENUE_STATUSES : BUSINESS_STATUSES;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
      <div className="flex gap-2">
        {(["venue", "business"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              setStatus("pending_review");
            }}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm",
              kind === k && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {k === "venue" ? t("admin.venues") : t("admin.businesses")}
          </button>
        ))}
      </div>
      <Field label={t("admin.statusFilter")}>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {t(`owner.status.${s}`)}
            </option>
          ))}
        </Select>
      </Field>
      {queue.isPending && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {queue.isError && <p className="text-destructive">{t("common.error")}</p>}
      {queue.data?.length === 0 && <p className="text-muted-foreground">{t("admin.empty")}</p>}
      <ul className="space-y-3">
        {queue.data?.map((item) => (
          <Item key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

export default function AdminReviewPage() {
  return <AuthGate role="admin">{() => <Queue />}</AuthGate>;
}

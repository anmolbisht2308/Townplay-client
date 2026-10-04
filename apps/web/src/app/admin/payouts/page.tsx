"use client";

import {
  adminPayoutRowSchema,
  formatPaise,
  rupeesToPaise,
  type AdminPayoutRow,
} from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { AuthGate } from "@/components/auth-gate";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

function Row({ row }: { row: AdminPayoutRow }) {
  const t = useTranslations("admin");
  const te = useTranslations("earnings");
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(String(row.payoutDuePaise / 100));
  const [reference, setReference] = useState("");
  const record = useMutation({
    mutationFn: (body: unknown) => api.send("POST", "/admin/payouts", z.unknown(), body),
    onSuccess: async () => {
      setReference("");
      await queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    record.mutate({
      businessId: row.businessId,
      amountPaise: rupeesToPaise(Number(amount || 0)),
      reference,
    });
  }
  return (
    <li className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{row.businessName}</p>
        <span className="text-sm font-semibold text-primary">
          {t("due", { amount: formatPaise(row.payoutDuePaise) })}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("advance", { amount: formatPaise(row.advanceOnlinePaise) })} ·{" "}
        {t("paidOut", { amount: formatPaise(row.paidOutPaise) })}
      </p>
      <p className="text-xs">
        {te(`payoutStatus.${row.payout.status}`)}
        {row.payout.accountLast4 &&
          ` · ${te("account", { last4: row.payout.accountLast4, ifsc: row.payout.ifsc ?? "" })}`}
        {row.payout.accountHolderName && ` · ${row.payout.accountHolderName}`}
      </p>
      {row.payout.mode === "manual" && row.payoutDuePaise > 0 && (
        <form onSubmit={submit} className="grid grid-cols-2 gap-2" noValidate>
          <Field label={t("amount")}>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label={t("reference")}>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </Field>
          <Button type="submit" size="sm" className="col-span-2" disabled={record.isPending}>
            {t("record")}
          </Button>
          <div className="col-span-2">
            <FormError
              error={record.error}
              labels={{ amountPaise: t("amount"), reference: t("reference") }}
            />
          </div>
        </form>
      )}
    </li>
  );
}

function Payouts() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const report = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: () => api.get("/admin/payouts", z.array(adminPayoutRowSchema)),
  });
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t("payouts")}</h1>
      {report.isPending && <p className="text-muted-foreground">{tc("loading")}</p>}
      {report.isError && <p className="text-destructive">{tc("error")}</p>}
      {report.data?.length === 0 && <p className="text-muted-foreground">{t("noPayouts")}</p>}
      <ul className="space-y-3">
        {report.data?.map((r) => (
          <Row key={r.businessId} row={r} />
        ))}
      </ul>
    </section>
  );
}

export default function AdminPayoutsPage() {
  return <AuthGate role="admin">{() => <Payouts />}</AuthGate>;
}

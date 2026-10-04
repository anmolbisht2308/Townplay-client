"use client";

import { businessSchema, payoutSetupRequestSchema, type Business } from "@townplay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export function PayoutForm({ business }: { business: Business }) {
  const t = useTranslations("earnings");
  const queryClient = useQueryClient();
  const [holder, setHolder] = useState(business.payout.accountHolderName ?? "");
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState(business.payout.ifsc ?? "");
  const [clientError, setClientError] = useState<unknown>(null);
  const save = useMutation({
    mutationFn: (body: unknown) =>
      api.send("POST", `/businesses/${business.id}/payout`, businessSchema, body),
    onSuccess: async () => {
      setAccount("");
      await queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = payoutSetupRequestSchema.safeParse({
      accountHolderName: holder,
      accountNumber: account,
      ifsc,
    });
    if (!parsed.success) return setClientError(parsed.error);
    setClientError(null);
    save.mutate(parsed.data);
  }

  const p = business.payout;
  return (
    <section className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{t("payoutTitle")}</h2>
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs">
          {t(`payoutStatus.${p.status}`)}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{t(`payoutMode.${p.mode}`)}</p>
      {p.accountLast4 && (
        <p className="text-sm">{t("account", { last4: p.accountLast4, ifsc: p.ifsc ?? "" })}</p>
      )}
      <p className="text-sm text-muted-foreground">{t("payoutIntro")}</p>
      <form onSubmit={submit} className="space-y-2" noValidate>
        <Field label={t("accountHolderName")}>
          <Input value={holder} onChange={(e) => setHolder(e.target.value)} />
        </Field>
        <Field label={t("accountNumber")}>
          <Input
            inputMode="numeric"
            autoComplete="off"
            value={account}
            onChange={(e) => setAccount(e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Field label={t("ifsc")}>
          <Input
            maxLength={11}
            value={ifsc}
            onChange={(e) => setIfsc(e.target.value.toUpperCase())}
          />
        </Field>
        <FormError
          error={clientError ?? save.error}
          labels={{
            accountHolderName: t("accountHolderName"),
            accountNumber: t("accountNumber"),
            ifsc: t("ifsc"),
          }}
        />
        <Button type="submit" disabled={save.isPending}>
          {t("savePayout")}
        </Button>
      </form>
    </section>
  );
}

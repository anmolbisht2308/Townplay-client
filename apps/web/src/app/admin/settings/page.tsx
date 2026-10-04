"use client";

import { rupeesToPaise, settingsSchema } from "@townplay/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { AuthGate } from "@/components/auth-gate";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

function FeeForm({ flatPaise, percent }: { flatPaise: number; percent: number }) {
  const t = useTranslations("admin");
  const [flat, setFlat] = useState(String(flatPaise / 100));
  const [pct, setPct] = useState(String(percent));
  const [clientError, setClientError] = useState<unknown>(null);
  const save = useMutation({
    mutationFn: (body: unknown) => api.send("PUT", "/admin/settings", settingsSchema, body),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = settingsSchema.safeParse({
      convenienceFee: { flatPaise: rupeesToPaise(Number(flat || 0)), percent: Number(pct || 0) },
    });
    if (!parsed.success) return setClientError(parsed.error);
    setClientError(null);
    save.mutate(parsed.data);
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <h1 className="text-2xl font-bold">{t("feeTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("feeHelp")}</p>
      <Field label={t("flatFee")}>
        <Input inputMode="decimal" value={flat} onChange={(e) => setFlat(e.target.value)} />
      </Field>
      <Field label={t("percentFee")}>
        <Input inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} />
      </Field>
      <FormError error={clientError ?? save.error} labels={{ convenienceFee: t("feeTitle") }} />
      {save.isSuccess && <p className="text-sm text-primary">{t("saved")}</p>}
      <Button type="submit" disabled={save.isPending}>
        {t("save")}
      </Button>
    </form>
  );
}

function Settings() {
  const tc = useTranslations("common");
  const settings = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.get("/admin/settings", settingsSchema),
  });
  if (settings.isPending) return <p className="text-muted-foreground">{tc("loading")}</p>;
  if (settings.isError) return <p className="text-destructive">{tc("error")}</p>;
  return <FeeForm {...settings.data.convenienceFee} />;
}

export default function AdminSettingsPage() {
  return <AuthGate role="admin">{() => <Settings />}</AuthGate>;
}

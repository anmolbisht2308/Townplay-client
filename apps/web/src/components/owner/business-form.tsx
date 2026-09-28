"use client";

import {
  BUSINESS_TYPES,
  businessSchema,
  createBusinessSchema,
  type Business,
  type CreateBusiness,
} from "@townplay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

const empty: CreateBusiness = {
  name: "",
  type: "sports",
  contactPhone: "",
  email: "",
  kyc: { legalName: "" },
};

export function BusinessForm({
  business,
  onDone,
}: {
  business?: Business;
  onDone: (b: Business) => void;
}) {
  const t = useTranslations("businessForm");
  const to = useTranslations("owner");
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateBusiness>(
    business
      ? {
          name: business.name,
          type: business.type,
          contactPhone: business.contactPhone,
          email: business.email,
          kyc: business.kyc,
        }
      : empty,
  );
  const [clientError, setClientError] = useState<unknown>(null);
  const save = useMutation({
    mutationFn: (input: CreateBusiness) =>
      business
        ? api.send("PATCH", `/businesses/${business.id}`, businessSchema, input)
        : api.send("POST", "/businesses", businessSchema, input),
    onSuccess: async (b) => {
      await queryClient.invalidateQueries({ queryKey: ["businesses"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      onDone(b);
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const kyc = {
      legalName: form.kyc.legalName,
      ...(form.kyc.pan ? { pan: form.kyc.pan } : {}),
      ...(form.kyc.gstin ? { gstin: form.kyc.gstin } : {}),
    };
    const parsed = createBusinessSchema.safeParse({ ...form, kyc });
    if (!parsed.success) return setClientError(parsed.error);
    setClientError(null);
    save.mutate(parsed.data);
  }

  const labels = {
    name: t("name"),
    type: t("type"),
    contactPhone: t("contactPhone"),
    email: t("email"),
    kyc: t("legalName"),
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <Field label={t("name")}>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label={t("type")}>
        <Select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as CreateBusiness["type"] })}
        >
          {BUSINESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`types.${type}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("contactPhone")}>
        <Input
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          value={form.contactPhone}
          onChange={(e) => setForm({ ...form, contactPhone: e.target.value.replace(/\D/g, "") })}
        />
      </Field>
      <Field label={t("email")}>
        <Input
          type="email"
          inputMode="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </Field>
      <Field label={t("legalName")}>
        <Input
          value={form.kyc.legalName}
          onChange={(e) => setForm({ ...form, kyc: { ...form.kyc, legalName: e.target.value } })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("pan")}>
          <Input
            maxLength={10}
            value={form.kyc.pan ?? ""}
            onChange={(e) =>
              setForm({ ...form, kyc: { ...form.kyc, pan: e.target.value.toUpperCase() } })
            }
          />
        </Field>
        <Field label={t("gstin")}>
          <Input
            maxLength={15}
            value={form.kyc.gstin ?? ""}
            onChange={(e) =>
              setForm({ ...form, kyc: { ...form.kyc, gstin: e.target.value.toUpperCase() } })
            }
          />
        </Field>
      </div>
      <FormError error={clientError ?? save.error} labels={labels} />
      <Button type="submit" size="lg" className="w-full" disabled={save.isPending}>
        {business ? to("save") : to("create")}
      </Button>
    </form>
  );
}

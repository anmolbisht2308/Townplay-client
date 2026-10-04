"use client";

import {
  PLAN_DURATIONS,
  planInputSchema,
  planSchema,
  rupeesToPaise,
  type Plan,
} from "@townplay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

/** Create or edit a membership plan (saved whole). */
export function PlanForm({
  venueId,
  plan,
  onDone,
}: {
  venueId: string;
  plan?: Plan;
  onDone: () => void;
}) {
  const t = useTranslations("ownerMemberships");
  const tm = useTranslations("memberships");
  const queryClient = useQueryClient();
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [months, setMonths] = useState(String(plan?.durationMonths ?? 1));
  const [rupees, setRupees] = useState(plan ? String(plan.pricePaise / 100) : "");
  const [discount, setDiscount] = useState(String(plan?.discountPercent ?? 10));
  const [cap, setCap] = useState(plan?.bookingsPerMonth ? String(plan.bookingsPerMonth) : "");
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);
  const [clientError, setClientError] = useState<unknown>(null);

  const save = useMutation({
    mutationFn: (body: unknown) =>
      plan
        ? api.send("PUT", `/owner/plans/${plan.id}`, planSchema, body)
        : api.send("POST", `/owner/venues/${venueId}/plans`, planSchema, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["plans", venueId] });
      onDone();
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = planInputSchema.safeParse({
      name,
      description,
      durationMonths: Number(months),
      pricePaise: rupeesToPaise(Number(rupees || "0")),
      discountPercent: Number(discount || "0"),
      bookingsPerMonth: cap.trim() ? Number(cap) : null,
      isActive,
    });
    if (!parsed.success) return setClientError(parsed.error);
    setClientError(null);
    save.mutate(parsed.data);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label={t("planName")}>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label={t("description")}>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("duration")}>
          <Select value={months} onChange={(e) => setMonths(e.target.value)}>
            {PLAN_DURATIONS.map((m) => (
              <option key={m} value={m}>
                {tm("months", { count: m })}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("price")}>
          <Input
            value={rupees}
            onChange={(e) => setRupees(e.target.value)}
            inputMode="decimal"
            required
          />
        </Field>
      </div>
      <Field label={t("discount")}>
        <Input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="numeric" />
      </Field>
      <Field label={t("cap")}>
        <Input value={cap} onChange={(e) => setCap(e.target.value)} inputMode="numeric" />
      </Field>
      <Checkbox
        label={t("onSale")}
        checked={isActive}
        onChange={(e) => setIsActive(e.target.checked)}
      />
      <FormError
        error={clientError ?? save.error}
        labels={{
          name: t("planName"),
          pricePaise: t("price"),
          discountPercent: t("discount"),
          bookingsPerMonth: t("cap"),
          durationMonths: t("duration"),
        }}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending}>
          {t("save")}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { eventSchema } from "@townplay/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { use, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { FormError } from "@/components/form-error";
import { EventForm } from "@/components/owner/event-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

function Edit({ id }: { id: string }) {
  const t = useTranslations("ownerEvents");
  const tc = useTranslations("common");
  const event = useQuery({
    queryKey: ["events", id],
    queryFn: () => api.get(`/events/${id}`, eventSchema),
  });
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const cancel = useMutation({
    mutationFn: () => api.send("POST", `/events/${id}/cancel`, eventSchema, { reason }),
    onSuccess: () => void event.refetch(),
  });
  if (event.isPending) return <p className="text-muted-foreground">{tc("loading")}</p>;
  if (event.isError) return <p className="text-destructive">{tc("error")}</p>;
  const e = event.data;
  const cancellable = e.status !== "cancelled" && e.status !== "completed";
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">{t("formEdit")}</h1>
      {cancellable && (
        <EventForm key={e.updatedAt} event={e} onSaved={() => void event.refetch()} />
      )}
      {cancellable && (
        <div className="space-y-2 rounded-lg border border-red-200 p-3">
          {confirming ? (
            <>
              <Field label={t("cancelReason")}>
                <Input
                  value={reason}
                  maxLength={500}
                  onChange={(ev) => setReason(ev.target.value)}
                />
              </Field>
              <p className="text-sm font-medium">{t("cancelConfirm")}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={cancel.isPending || reason.trim().length < 3}
                  onClick={() => cancel.mutate()}
                >
                  {t("cancel")}
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  {tc("close")}
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" onClick={() => setConfirming(true)}>
              {t("cancel")}
            </Button>
          )}
          <FormError error={cancel.error} labels={{}} />
        </div>
      )}
    </section>
  );
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate>{() => <Edit id={id} />}</AuthGate>;
}

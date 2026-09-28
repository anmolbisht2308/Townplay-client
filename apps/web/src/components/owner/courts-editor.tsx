"use client";

import {
  SLOT_DURATIONS,
  SPORTS,
  createResourceSchema,
  resourceSchema,
  rupeesToPaise,
  type CreateResource,
  type Resource,
} from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type Band = { days: number[]; start: string; end: string; rupees: string };
type Draft = Omit<CreateResource, "pricingRules"> & { bands: Band[] };

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function toDraft(r?: Resource): Draft {
  if (!r) {
    return {
      name: "",
      sport: "football",
      slotDurationMins: 60,
      maxPlayers: 10,
      isActive: true,
      bands: [{ days: ALL_DAYS, start: "06:00", end: "24:00", rupees: "" }],
    };
  }
  const { id: _i, venueId: _v, pricingRules, ...rest } = r;
  return {
    ...rest,
    bands: pricingRules.map((p) => ({
      days: p.days,
      start: p.start,
      end: p.end,
      rupees: String(p.pricePaise / 100),
    })),
  };
}

function toInput({ bands, ...rest }: Draft) {
  return {
    ...rest,
    pricingRules: bands.map((b) => ({
      days: [...b.days].sort(),
      start: b.start,
      end: b.end,
      pricePaise: b.rupees.trim() === "" ? -1 : rupeesToPaise(Number(b.rupees)),
    })),
  };
}

function CourtForm({
  venueId,
  court,
  onDone,
}: {
  venueId: string;
  court?: Resource;
  onDone: () => void;
}) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() => toDraft(court));
  const [clientError, setClientError] = useState<unknown>(null);
  const save = useMutation({
    mutationFn: (input: CreateResource) =>
      court
        ? api.send("PATCH", `/venues/${venueId}/resources/${court.id}`, resourceSchema, input)
        : api.send("POST", `/venues/${venueId}/resources`, resourceSchema, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["courts", venueId] });
      onDone();
    },
  });
  const setBand = (i: number, patch: Partial<Band>) =>
    setDraft((d) => ({ ...d, bands: d.bands.map((b, j) => (j === i ? { ...b, ...patch } : b)) }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = createResourceSchema.safeParse(toInput(draft));
    if (!parsed.success) return setClientError(parsed.error);
    setClientError(null);
    save.mutate(parsed.data);
  }

  const labels = {
    name: t("courtForm.name"),
    sport: t("courtForm.sport"),
    slotDurationMins: t("courtForm.slotDuration"),
    maxPlayers: t("courtForm.maxPlayers"),
    pricingRules: t("courtForm.pricing"),
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-3" noValidate>
      <Field label={t("courtForm.name")}>
        <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("courtForm.sport")}>
          <Select
            value={draft.sport}
            onChange={(e) => setDraft({ ...draft, sport: e.target.value as Draft["sport"] })}
          >
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {t(`sports.${s}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("courtForm.slotDuration")}>
          <Select
            value={draft.slotDurationMins}
            onChange={(e) =>
              setDraft({
                ...draft,
                slotDurationMins: Number(e.target.value) as Draft["slotDurationMins"],
              })
            }
          >
            {SLOT_DURATIONS.map((d) => (
              <option key={d} value={d}>
                {t("courtForm.minutes", { mins: d })}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("courtForm.maxPlayers")}>
          <Input
            inputMode="numeric"
            value={String(draft.maxPlayers)}
            onChange={(e) =>
              setDraft({ ...draft, maxPlayers: Number(e.target.value.replace(/\D/g, "")) })
            }
          />
        </Field>
        <div className="flex items-end pb-2">
          <Checkbox
            label={t("courtForm.active")}
            checked={draft.isActive}
            onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">{t("courtForm.pricing")}</legend>
        {draft.bands.map((b, i) => (
          <div key={i} className="space-y-2 rounded-md bg-accent p-2">
            <div className="flex flex-wrap gap-1" role="group" aria-label={t("courtForm.days")}>
              {ALL_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={b.days.includes(d)}
                  onClick={() =>
                    setBand(i, {
                      days: b.days.includes(d) ? b.days.filter((x) => x !== d) : [...b.days, d],
                    })
                  }
                  className={
                    b.days.includes(d)
                      ? "rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
                      : "rounded-md border bg-background px-2 py-1 text-xs"
                  }
                >
                  {t(`weekdaysShort.${d}` as "weekdaysShort.0")}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label={t("courtForm.from")}>
                <Input
                  type="time"
                  value={b.start}
                  onChange={(e) => setBand(i, { start: e.target.value })}
                />
              </Field>
              <Field label={t("courtForm.to")}>
                <Input
                  type="time"
                  value={b.end === "24:00" ? "23:59" : b.end}
                  onChange={(e) =>
                    setBand(i, { end: e.target.value === "23:59" ? "24:00" : e.target.value })
                  }
                />
              </Field>
              <Field label={t("courtForm.price")}>
                <Input
                  inputMode="decimal"
                  value={b.rupees}
                  onChange={(e) => setBand(i, { rupees: e.target.value })}
                />
              </Field>
            </div>
            {draft.bands.length > 1 && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setDraft({ ...draft, bands: draft.bands.filter((_, j) => j !== i) })}
              >
                {t("courtForm.removeBand")}
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setDraft({
              ...draft,
              bands: [...draft.bands, { days: [0, 6], start: "06:00", end: "24:00", rupees: "" }],
            })
          }
        >
          {t("courtForm.addBand")}
        </Button>
      </fieldset>

      <FormError error={clientError ?? save.error} labels={labels} />
      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending}>
          {court ? t("owner.save") : t("owner.create")}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("owner.cancel")}
        </Button>
      </div>
    </form>
  );
}

export function CourtsEditor({ venueId }: { venueId: string }) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const courts = useQuery({
    queryKey: ["courts", venueId],
    queryFn: () => api.get(`/venues/${venueId}/resources`, z.array(resourceSchema)),
  });
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const remove = useMutation({
    mutationFn: (id: string) => api.send("DELETE", `/venues/${venueId}/resources/${id}`, z.null()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courts", venueId] }),
  });

  if (courts.isPending) return <p className="text-muted-foreground">{t("common.loading")}</p>;
  if (courts.isError) return <p className="text-destructive">{t("common.error")}</p>;

  return (
    <div className="space-y-3">
      {courts.data.length === 0 && (
        <p className="text-muted-foreground">{t("courtForm.noCourts")}</p>
      )}
      {courts.data.map((c) =>
        editing === c.id ? (
          <CourtForm key={c.id} venueId={venueId} court={c} onDone={() => setEditing(null)} />
        ) : (
          <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-muted-foreground">
                {t(`sports.${c.sport}`)} · {t("courtForm.minutes", { mins: c.slotDurationMins })}
                {!c.isActive && ` · ${t("owner.status.hidden")}`}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setEditing(c.id)}>
                {t("owner.edit")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate(c.id)}
              >
                {t("owner.delete")}
              </Button>
            </div>
          </div>
        ),
      )}
      {editing === "new" ? (
        <CourtForm venueId={venueId} onDone={() => setEditing(null)} />
      ) : (
        <Button onClick={() => setEditing("new")}>{t("courtForm.add")}</Button>
      )}
    </div>
  );
}

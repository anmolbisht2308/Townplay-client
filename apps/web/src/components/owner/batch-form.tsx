"use client";

import {
  batchSchema,
  createBatchSchema,
  istDate,
  resourceSchema,
  rupeesToPaise,
  updateBatchSchema,
  type Batch,
} from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError, api } from "@/lib/api";

const WEEK = [1, 2, 3, 4, 5, 6, 0];

/** New batch (schedule + optional court) or edit an existing one's details. */
export function BatchForm({
  venueId,
  batch,
  onDone,
}: {
  venueId: string;
  batch?: Batch;
  onDone: () => void;
}) {
  const t = useTranslations("ownerMemberships");
  const tAll = useTranslations();
  const queryClient = useQueryClient();
  const courts = useQuery({
    queryKey: ["resources", venueId],
    queryFn: () => api.get(`/venues/${venueId}/resources`, z.array(resourceSchema)),
    enabled: !batch,
  });
  const [title, setTitle] = useState(batch?.title ?? "");
  const [activity, setActivity] = useState(batch?.activity ?? "");
  const [coachName, setCoachName] = useState(batch?.coachName ?? "");
  const [description, setDescription] = useState(batch?.description ?? "");
  const [capacity, setCapacity] = useState(String(batch?.capacity ?? 20));
  const [rupees, setRupees] = useState(batch ? String(batch.monthlyFeePaise / 100) : "");
  const [resourceId, setResourceId] = useState("");
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [startDate, setStartDate] = useState(istDate());
  const [clientError, setClientError] = useState<unknown>(null);

  const save = useMutation({
    mutationFn: (body: unknown) =>
      batch
        ? api.send("PATCH", `/owner/batches/${batch.id}`, batchSchema, body)
        : api.send("POST", `/owner/venues/${venueId}/batches`, batchSchema, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["batches", venueId] });
      onDone();
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const common = {
      title,
      activity,
      coachName,
      description,
      capacity: Number(capacity),
      monthlyFeePaise: rupeesToPaise(Number(rupees || "0")),
    };
    const parsed = batch
      ? updateBatchSchema.safeParse(common)
      : createBatchSchema.safeParse({
          ...common,
          resourceId: resourceId || null,
          days,
          startTime,
          endTime,
          startDate,
        });
    if (!parsed.success) return setClientError(parsed.error);
    setClientError(null);
    save.mutate(parsed.data);
  };

  const clashDates =
    save.error instanceof ApiError &&
    save.error.code === "SLOT_TAKEN" &&
    typeof save.error.details === "object" &&
    save.error.details !== null &&
    "dates" in save.error.details &&
    Array.isArray(save.error.details.dates)
      ? (save.error.details.dates as string[])
      : null;

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label={t("batchTitle")}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("activity")}>
          <Input value={activity} onChange={(e) => setActivity(e.target.value)} required />
        </Field>
        <Field label={t("coach")}>
          <Input value={coachName} onChange={(e) => setCoachName(e.target.value)} required />
        </Field>
      </div>
      {batch ? (
        <p className="text-sm text-muted-foreground">{t("scheduleFixed")}</p>
      ) : (
        <>
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">{t("days")}</legend>
            <div className="flex flex-wrap gap-1">
              {WEEK.map((d) => {
                const on = days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDays((xs) => (on ? xs.filter((x) => x !== d) : [...xs, d]))}
                    className={`h-10 min-w-11 rounded-md border px-2 text-sm ${
                      on ? "border-primary bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    {tAll(`weekdaysShort.${d}` as "weekdaysShort.0")}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("start")}>
              <Input
                type="time"
                step={1800}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Field>
            <Field label={t("end")}>
              <Input
                type="time"
                step={1800}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </Field>
          </div>
          <Field label={t("startDate")}>
            <Input
              type="date"
              min={istDate()}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label={t("court")}>
            <Select value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
              <option value="">{t("noCourt")}</option>
              {(courts.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          {resourceId && <p className="text-sm text-muted-foreground">{t("reserveNote")}</p>}
        </>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("capacity")}>
          <Input
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            inputMode="numeric"
          />
        </Field>
        <Field label={t("fee")}>
          <Input
            value={rupees}
            onChange={(e) => setRupees(e.target.value)}
            inputMode="decimal"
            required
          />
        </Field>
      </div>
      <Field label={t("description")}>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      {clashDates ? (
        <p className="text-sm text-destructive">{t("clash", { dates: clashDates.join(", ") })}</p>
      ) : (
        <FormError
          error={clientError ?? save.error}
          labels={{
            title: t("batchTitle"),
            activity: t("activity"),
            coachName: t("coach"),
            capacity: t("capacity"),
            monthlyFeePaise: t("fee"),
            days: t("days"),
            startTime: t("start"),
            endTime: t("end"),
            startDate: t("startDate"),
          }}
        />
      )}
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

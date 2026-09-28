"use client";

import {
  AMENITIES,
  SPORTS,
  VENUE_CATEGORIES,
  createVenueSchema,
  updateVenueSchema,
  venueSchema,
  type OpeningHours,
  type UpdateVenue,
  type Venue,
} from "@townplay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { FormError } from "@/components/form-error";
import { PhotoUploader } from "@/components/owner/photo-uploader";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type FormState = Required<UpdateVenue>;

const defaultHours: OpeningHours = Array.from({ length: 7 }, () => ({
  open: "06:00",
  close: "23:00",
  closed: false,
}));

function initial(venue?: Venue): FormState {
  if (venue) {
    const {
      id: _i,
      businessId: _b,
      citySlug: _c,
      slug: _s,
      status: _st,
      reviewNote: _r,
      updatedAt: _u,
      ...rest
    } = venue;
    return rest;
  }
  return {
    name: "",
    category: "sports",
    sports: [],
    amenities: [],
    description: "",
    address: "",
    area: "",
    location: { lat: 0, lng: 0 },
    photos: [],
    openingHours: defaultHours,
    bookingPolicy: {
      advancePercent: 30,
      cancellationCutoffHours: 6,
      refundPercentBeforeCutoff: 100,
    },
  };
}

const toggle = <T,>(list: T[], item: T) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

/** Create (with businessId + citySlug) or edit a venue. */
export function VenueForm({
  venue,
  businessId,
  citySlug = "bareilly",
  onSaved,
}: {
  venue?: Venue;
  businessId?: string;
  citySlug?: string;
  onSaved: (v: Venue) => void;
}) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => initial(venue));
  const [clientError, setClientError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const save = useMutation({
    mutationFn: (body: unknown) =>
      venue
        ? api.send("PATCH", `/venues/${venue.id}`, venueSchema, body)
        : api.send("POST", "/venues", venueSchema, body),
    onSuccess: async (v) => {
      await queryClient.invalidateQueries({ queryKey: ["venues"] });
      setSaved(true);
      onSaved(v);
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = venue
      ? updateVenueSchema.safeParse(form)
      : createVenueSchema.safeParse({ ...form, businessId, citySlug });
    if (!parsed.success) return setClientError(parsed.error);
    setClientError(null);
    save.mutate(parsed.data);
  }

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition(({ coords }) =>
      set("location", {
        lat: Number(coords.latitude.toFixed(6)),
        lng: Number(coords.longitude.toFixed(6)),
      }),
    );
  }

  const labels = {
    name: t("venueForm.name"),
    category: t("venueForm.category"),
    sports: t("venue.sports"),
    amenities: t("venue.amenities"),
    description: t("venueForm.description"),
    address: t("venueForm.address"),
    area: t("venueForm.area"),
    location: t("venueForm.location"),
    photos: t("venueForm.photos"),
    openingHours: t("venueForm.hours"),
    bookingPolicy: t("venueForm.policy"),
  };
  const num = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field label={t("venueForm.name")}>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label={t("venueForm.category")}>
        <Select
          value={form.category}
          onChange={(e) => set("category", e.target.value as FormState["category"])}
        >
          {VENUE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`categories.${c}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("venueForm.description")}>
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <Field label={t("venueForm.address")}>
        <Textarea
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          className="min-h-16"
        />
      </Field>
      <Field label={t("venueForm.area")}>
        <Input value={form.area} onChange={(e) => set("area", e.target.value)} />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("venueForm.location")}</legend>
        <p className="text-sm text-muted-foreground">{t("venueForm.locationHelp")}</p>
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
          {t("venueForm.useMyLocation")}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("venueForm.lat")}>
            <Input
              inputMode="decimal"
              value={String(form.location.lat)}
              onChange={(e) => set("location", { ...form.location, lat: num(e.target.value) })}
            />
          </Field>
          <Field label={t("venueForm.lng")}>
            <Input
              inputMode="decimal"
              value={String(form.location.lng)}
              onChange={(e) => set("location", { ...form.location, lng: num(e.target.value) })}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("venue.sports")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {SPORTS.map((s) => (
            <Checkbox
              key={s}
              label={t(`sports.${s}`)}
              checked={form.sports.includes(s)}
              onChange={() => set("sports", toggle(form.sports, s))}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("venue.amenities")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.map((a) => (
            <Checkbox
              key={a}
              label={t(`amenities.${a}`)}
              checked={form.amenities.includes(a)}
              onChange={() => set("amenities", toggle(form.amenities, a))}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("venueForm.photos")}</legend>
        <PhotoUploader photos={form.photos} onChange={(p) => set("photos", p)} />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("venueForm.hours")}</legend>
        {form.openingHours.map((d, i) => {
          const update = (patch: Partial<typeof d>) =>
            set(
              "openingHours",
              form.openingHours.map((x, j) => (j === i ? { ...x, ...patch } : x)),
            );
          return (
            <div key={i} className="grid grid-cols-[4.5rem_1fr_1fr_auto] items-center gap-2">
              <span className="text-sm">{t(`weekdaysShort.${i}` as "weekdaysShort.0")}</span>
              <Input
                type="time"
                aria-label={t("venueForm.open")}
                value={d.open}
                disabled={d.closed}
                onChange={(e) => update({ open: e.target.value })}
              />
              <Input
                type="time"
                aria-label={t("venueForm.close")}
                value={d.close === "24:00" ? "23:59" : d.close}
                disabled={d.closed}
                onChange={(e) =>
                  update({ close: e.target.value === "23:59" ? "24:00" : e.target.value })
                }
              />
              <Checkbox
                label={t("venueForm.closedDay")}
                checked={d.closed}
                onChange={(e) => update({ closed: e.target.checked })}
              />
            </div>
          );
        })}
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-2">
        <legend className="mb-2 text-sm font-medium">{t("venueForm.policy")}</legend>
        {(
          [
            ["advancePercent", "venueForm.advancePercent"],
            ["cancellationCutoffHours", "venueForm.cutoffHours"],
            ["refundPercentBeforeCutoff", "venueForm.refundPercent"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={t(label)}>
            <Input
              inputMode="numeric"
              value={String(form.bookingPolicy[key])}
              onChange={(e) =>
                set("bookingPolicy", {
                  ...form.bookingPolicy,
                  [key]: num(e.target.value.replace(/\D/g, "")),
                })
              }
            />
          </Field>
        ))}
      </fieldset>

      <FormError error={clientError ?? save.error} labels={labels} />
      {saved && <p className="text-sm text-primary">{t("owner.saved")}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={save.isPending}>
        {venue ? t("owner.save") : t("owner.create")}
      </Button>
    </form>
  );
}

"use client";

import {
  EVENT_TYPES,
  businessSchema,
  createEventSchema,
  eventSchema,
  rupeesToPaise,
  updateEventSchema,
  venueSchema,
  type Event,
  type EventType,
  type Photo,
} from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { FormError } from "@/components/form-error";
import { PhotoUploader } from "@/components/owner/photo-uploader";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type TierRow = { id?: string; name: string; rupees: string; capacity: string };

/** ISO instant ⇄ the IST wall time a datetime-local input shows. */
const toLocal = (iso: string) =>
  new Date(Date.parse(iso) + 330 * 60_000).toISOString().slice(0, 16);
const fromLocal = (local: string) => (local ? new Date(`${local}:00+05:30`).toISOString() : "");

export function EventForm({ event, onSaved }: { event?: Event; onSaved: (e: Event) => void }) {
  const t = useTranslations("ownerEvents");
  const tv = useTranslations("venueForm");
  const te = useTranslations("events");
  const queryClient = useQueryClient();
  const businesses = useQuery({
    queryKey: ["businesses"],
    queryFn: () => api.get("/businesses/mine", z.array(businessSchema)),
  });
  const venues = useQuery({
    queryKey: ["venues"],
    queryFn: () => api.get("/venues/mine", z.array(venueSchema)),
  });

  const [businessId, setBusinessId] = useState(event?.businessId ?? "");
  const [title, setTitle] = useState(event?.title ?? "");
  const [type, setType] = useState<EventType>(event?.type ?? "seasonal");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startsAt, setStartsAt] = useState(event ? toLocal(event.startsAt) : "");
  const [endsAt, setEndsAt] = useState(event ? toLocal(event.endsAt) : "");
  const [mode, setMode] = useState<"venue" | "custom">(event?.venueId ? "venue" : "custom");
  const [venueId, setVenueId] = useState(event?.venueId ?? "");
  const [address, setAddress] = useState(event && !event.venueId ? event.address : "");
  const [lat, setLat] = useState(event && !event.venueId ? String(event.location.lat) : "");
  const [lng, setLng] = useState(event && !event.venueId ? String(event.location.lng) : "");
  const [ageLimit, setAgeLimit] = useState(event?.ageLimit ? String(event.ageLimit) : "");
  const [photos, setPhotos] = useState<Photo[]>(event?.photos ?? []);
  const [tiers, setTiers] = useState<TierRow[]>(
    event?.tiers.map((x) => ({
      id: x.id,
      name: x.name,
      rupees: String(x.pricePaise / 100),
      capacity: String(x.capacity),
    })) ?? [{ name: "", rupees: "0", capacity: "100" }],
  );
  const [clientError, setClientError] = useState<unknown>(null);

  const chosenBusiness = businessId || businesses.data?.[0]?.id || "";
  const myVenues = (venues.data ?? []).filter((v) => v.businessId === chosenBusiness);

  const save = useMutation({
    mutationFn: (body: unknown) =>
      event
        ? api.send("PATCH", `/events/${event.id}`, eventSchema, body)
        : api.send("POST", "/events", eventSchema, body),
    onSuccess: async (e) => {
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      onSaved(e);
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const body = {
      title,
      type,
      description,
      photos,
      startsAt: fromLocal(startsAt),
      endsAt: fromLocal(endsAt),
      venueId: mode === "venue" ? venueId || null : null,
      address: mode === "custom" ? address : null,
      location: mode === "custom" && lat && lng ? { lat: Number(lat), lng: Number(lng) } : null,
      ageLimit: ageLimit ? Number(ageLimit) : null,
      tiers: tiers.map((x) => ({
        ...(x.id ? { id: x.id } : {}),
        name: x.name,
        pricePaise: rupeesToPaise(Number(x.rupees || 0)),
        capacity: Number(x.capacity || 0),
      })),
    };
    const parsed = event
      ? updateEventSchema.safeParse(body)
      : createEventSchema.safeParse({ ...body, businessId: chosenBusiness, citySlug: "bareilly" });
    if (!parsed.success) return setClientError(parsed.error);
    setClientError(null);
    save.mutate(parsed.data);
  }

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      setLat(coords.latitude.toFixed(6));
      setLng(coords.longitude.toFixed(6));
    });
  }

  const labels = {
    title: t("eventTitle"),
    startsAt: t("startsAt"),
    endsAt: t("endsAt"),
    address: t("address"),
    venueId: t("venue"),
    tiers: t("tiers"),
    businessId: t("business"),
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {!event && (businesses.data?.length ?? 0) > 1 && (
        <Field label={t("business")}>
          <Select value={chosenBusiness} onChange={(e) => setBusinessId(e.target.value)}>
            {businesses.data?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label={t("eventTitle")}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label={t("type")}>
        <Select value={type} onChange={(e) => setType(e.target.value as EventType)}>
          {EVENT_TYPES.map((x) => (
            <option key={x} value={x}>
              {te(`types.${x}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("description")}>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 gap-2">
        <Field label={t("startsAt")}>
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </Field>
        <Field label={t("endsAt")}>
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("place")}</legend>
        <div className="flex gap-2">
          {(["venue", "custom"] as const).map((m) => (
            <Button
              key={m}
              type="button"
              size="sm"
              variant={mode === m ? "default" : "outline"}
              onClick={() => setMode(m)}
            >
              {m === "venue" ? t("atVenue") : t("custom")}
            </Button>
          ))}
        </div>
        {mode === "venue" ? (
          <Field label={t("venue")}>
            <Select value={venueId} onChange={(e) => setVenueId(e.target.value)}>
              <option value="">—</option>
              {myVenues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <>
            <Field label={t("address")}>
              <Textarea
                className="min-h-16"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>
            <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
              {tv("useMyLocation")}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Field label={tv("lat")}>
                <Input inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} />
              </Field>
              <Field label={tv("lng")}>
                <Input inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} />
              </Field>
            </div>
          </>
        )}
      </fieldset>

      <Field label={t("ageLimit")}>
        <Input
          inputMode="numeric"
          value={ageLimit}
          onChange={(e) => setAgeLimit(e.target.value.replace(/\D/g, ""))}
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{tv("photos")}</legend>
        <PhotoUploader photos={photos} onChange={setPhotos} />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("tiers")}</legend>
        {tiers.map((row, i) => {
          const set = (patch: Partial<TierRow>) =>
            setTiers((all) => all.map((r, j) => (j === i ? { ...r, ...patch } : r)));
          return (
            <div
              key={row.id ?? `new-${i}`}
              className="grid grid-cols-3 gap-2 rounded-md bg-accent p-2"
            >
              <Field label={t("tierName")} className="col-span-3">
                <Input value={row.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label={t("tierPrice")}>
                <Input
                  inputMode="decimal"
                  value={row.rupees}
                  onChange={(e) => set({ rupees: e.target.value })}
                />
              </Field>
              <Field label={t("tierCapacity")}>
                <Input
                  inputMode="numeric"
                  value={row.capacity}
                  onChange={(e) => set({ capacity: e.target.value.replace(/\D/g, "") })}
                />
              </Field>
              <div className="flex items-end">
                {tiers.length > 1 && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setTiers((all) => all.filter((_, j) => j !== i))}
                  >
                    {t("removeTier")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setTiers((all) => [...all, { name: "", rupees: "0", capacity: "50" }])}
        >
          {t("addTier")}
        </Button>
      </fieldset>

      <FormError error={clientError ?? save.error} labels={labels} />
      <Button type="submit" size="lg" className="w-full" disabled={save.isPending}>
        {t("save")}
      </Button>
    </form>
  );
}

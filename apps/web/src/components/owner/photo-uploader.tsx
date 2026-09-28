"use client";

import { uploadSignatureSchema, type Photo } from "@townplay/shared";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { buttonVariants } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { compressImage } from "@/lib/compress";
import { imageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

const cloudinaryResponse = z.object({ secure_url: z.url(), public_id: z.string() });

export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: Photo[];
  onChange: (p: Photo[]) => void;
}) {
  const t = useTranslations("venueForm");
  const tc = useTranslations("common");
  const [busy, setBusy] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [failed, setFailed] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setFailed(false);
    try {
      const added: Photo[] = [];
      for (const file of Array.from(files).slice(0, 12 - photos.length)) {
        const sig = await api.send("POST", "/uploads/sign", uploadSignatureSchema, {
          purpose: "venue_photo",
        });
        const form = new FormData();
        form.append("file", await compressImage(file));
        form.append("api_key", sig.apiKey);
        form.append("timestamp", String(sig.timestamp));
        form.append("signature", sig.signature);
        form.append("folder", sig.folder);
        const res = await fetch(sig.uploadUrl, { method: "POST", body: form });
        if (!res.ok) throw new Error(`upload failed: ${res.status}`);
        const body = cloudinaryResponse.parse(await res.json());
        added.push({ url: body.secure_url, publicId: body.public_id });
      }
      onChange([...photos, ...added]);
    } catch (err) {
      if (err instanceof ApiError && err.code === "UPLOADS_DISABLED") setDisabled(true);
      else setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p) => (
          <div key={p.publicId} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary already resizes */}
            <img
              src={imageUrl(p.url, 240)}
              alt=""
              className="aspect-square w-full rounded-md object-cover"
            />
            <button
              type="button"
              aria-label={t("removePhoto")}
              onClick={() => onChange(photos.filter((x) => x.publicId !== p.publicId))}
              className="absolute right-1 top-1 rounded-full bg-background/90 px-2 text-sm"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {disabled ? (
        <p className="text-sm text-muted-foreground">{t("uploadsDisabled")}</p>
      ) : (
        <label
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "cursor-pointer",
            (busy || photos.length >= 12) && "pointer-events-none opacity-50",
          )}
        >
          {busy ? t("uploading") : t("addPhotos")}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy || photos.length >= 12}
            onChange={(e) => void upload(e.target.files)}
          />
        </label>
      )}
      {failed && <p className="text-sm text-destructive">{tc("error")}</p>}
    </div>
  );
}

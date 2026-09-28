"use client";

import { useTranslations } from "next-intl";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api";

/** Top-level field names from a Zod error (client-side) or an api VALIDATION_FAILED error. */
function fieldsOf(error: unknown): string[] {
  const issues =
    error instanceof ZodError
      ? error.issues
      : error instanceof ApiError && Array.isArray(error.details)
        ? (error.details as { path?: unknown[] }[])
        : [];
  return [...new Set(issues.map((i) => String(i.path?.[0] ?? "")).filter(Boolean))];
}

export function FormError({ error, labels }: { error: unknown; labels: Record<string, string> }) {
  const t = useTranslations();
  if (!error) return null;
  const fields = fieldsOf(error);
  let message = t("common.error");
  if (fields.length > 0) {
    message = t("owner.fixFields", { fields: fields.map((f) => labels[f] ?? f).join(", ") });
  } else if (error instanceof ApiError && error.code === "NO_RESOURCES") {
    message = t("owner.needCourt");
  } else if (error instanceof ApiError && error.status < 500) {
    message = error.message;
  }
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

/** Server-only env, validated when next.config loads (build + start fail fast). */
const serverSchema = z.object({
  API_URL: process.env.VERCEL === "1" ? z.url() : z.url().default("http://localhost:4000"),
});

/** Public env. Each key is read literally so Next can inline it in client bundles. */
const clientSchema = z.object({
  NEXT_PUBLIC_SENTRY_DSN: optional,
  /** Canonical site origin for metadata, sitemap and OpenGraph URLs. */
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

export function parseServerEnv(source: Record<string, string | undefined>) {
  return serverSchema.parse(source);
}

export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
});

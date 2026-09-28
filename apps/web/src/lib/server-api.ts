import "server-only";
import { notFound } from "next/navigation";
import type { z } from "zod";
import { parseServerEnv } from "@/env";

const { API_URL } = parseServerEnv(process.env);

/**
 * Server-side GET straight to the api (no rewrite hop). Public listing data is cached for a
 * minute; a 404 renders the Next not-found page.
 */
export async function serverGet<T extends z.ZodType>(
  path: string,
  schema: T,
  revalidate = 60,
): Promise<z.infer<T>> {
  const res = await fetch(`${API_URL}/v1${path}`, { next: { revalidate } });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return schema.parse(await res.json());
}

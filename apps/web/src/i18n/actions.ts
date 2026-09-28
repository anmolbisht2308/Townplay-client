"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, toLocale } from "./config";

export async function setLocale(lang: string): Promise<void> {
  (await cookies()).set(LOCALE_COOKIE, toLocale(lang), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

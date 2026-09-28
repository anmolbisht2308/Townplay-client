import { apiErrorSchema, meSchema, type Me } from "@townplay/shared";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

/** Fetches the api through the same-origin /v1 rewrite, parsing `{ error: { code, message } }`. */
export async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`/v1${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body: unknown = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    if (parsed.success) {
      const { code, message, details } = parsed.data.error;
      throw new ApiError(res.status, code, message, details);
    }
    throw new ApiError(res.status, "INTERNAL", res.statusText);
  }
  return body;
}

/** GET /v1/me; null when signed out. */
export async function getMe(): Promise<Me | null> {
  try {
    return meSchema.parse(await apiFetch("/me"));
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

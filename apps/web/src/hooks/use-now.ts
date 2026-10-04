"use client";

import { useEffect, useState } from "react";

/** Current time in ms, refreshed every `everyMs` (keeps renders pure). */
export function useNow(everyMs = 15_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

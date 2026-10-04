"use client";

import {
  BOOKING_EVENT,
  SOCKET_PATH,
  bookingEventSchema,
  type BookingEvent,
} from "@townplay/shared";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

/**
 * Joins the venue's Socket.io room (same origin through the /v1 rewrite, session cookie auth)
 * and calls `onEvent` for every booking change. Polling first: it works through proxies that
 * do not pass WebSocket upgrades.
 */
export function useVenueLive(venueId: string, onEvent: (e: BookingEvent) => void): boolean {
  const [connected, setConnected] = useState(false);
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const socket = io({
      path: SOCKET_PATH,
      withCredentials: true,
      transports: ["polling", "websocket"],
    });
    socket.on("connect", () => {
      socket.emit("join", venueId, (r: { ok: boolean }) => setConnected(r.ok));
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on(BOOKING_EVENT, (raw: unknown) => {
      const parsed = bookingEventSchema.safeParse(raw);
      if (parsed.success) handler.current(parsed.data);
    });
    return () => {
      socket.disconnect();
    };
  }, [venueId]);

  return connected;
}

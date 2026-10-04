"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type State = "unsupported" | "denied" | "off" | "on" | "busy";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Lets an owner turn on push alerts for new bookings and cancellations on this device. */
export function PushToggle() {
  const t = useTranslations("push");
  const [state, setState] = useState<State>("off");

  useEffect(() => {
    // Browser capabilities are only known after mount (SSR renders the "off" button).
    async function detect(): Promise<State> {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        return "unsupported";
      }
      if (Notification.permission === "denied") return "denied";
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      return (await reg?.pushManager.getSubscription()) ? "on" : "off";
    }
    void detect().then(setState);
  }, []);

  async function enable() {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "denied" : "off");
      const { publicKey } = await api.get("/push/public-key", z.object({ publicKey: z.string() }));
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      const json = sub.toJSON();
      await api.send("POST", "/push/subscriptions", z.null(), {
        endpoint: json.endpoint,
        keys: json.keys,
      });
      setState("on");
    } catch {
      setState("off");
    }
  }

  if (state === "unsupported")
    return <p className="text-xs text-muted-foreground">{t("unsupported")}</p>;
  if (state === "denied") return <p className="text-xs text-muted-foreground">{t("denied")}</p>;
  if (state === "on") return <p className="text-xs text-primary">● {t("enabled")}</p>;
  return (
    <Button variant="outline" size="sm" disabled={state === "busy"} onClick={() => void enable()}>
      {t("enable")}
    </Button>
  );
}

"use client";

import { attendeeSchema, checkInResultSchema, type CheckInResult } from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { use, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { AuthGate } from "@/components/auth-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// BarcodeDetector (Chrome on Android) is not in the TS DOM lib yet.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
  }
}

function ResultBanner({ result }: { result: CheckInResult }) {
  const t = useTranslations("ownerEvents");
  const locale = useLocale();
  const ok = result.result === "ok";
  const time = result.ticket?.checkedInAt
    ? new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
        timeZone: "Asia/Kolkata",
        timeStyle: "short",
      }).format(new Date(result.ticket.checkedInAt))
    : null;
  return (
    <div
      role="status"
      className={cn(
        "rounded-lg p-4 text-center",
        ok
          ? "bg-green-600 text-white"
          : result.result === "already"
            ? "bg-amber-400 text-amber-950"
            : "bg-red-600 text-white",
      )}
    >
      <p className="text-xl font-bold">{t(`result.${result.result}`)}</p>
      {result.ticket && (
        <p>
          {result.ticket.holderName} · {result.ticket.tierName}
          {result.result === "already" && time && ` · ${t("at", { time })}`}
        </p>
      )}
    </div>
  );
}

function CheckIn({ id }: { id: string }) {
  const t = useTranslations("ownerEvents");
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastToken = useRef<{ value: string; at: number } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [supported, setSupported] = useState(true);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [code, setCode] = useState("");
  const [q, setQ] = useState("");

  const scan = useMutation({
    mutationFn: (body: { qrToken: string } | { ticketId: string }) =>
      "qrToken" in body
        ? api.send("POST", `/events/${id}/checkin`, checkInResultSchema, body)
        : api.send("POST", `/events/${id}/tickets/${body.ticketId}/checkin`, checkInResultSchema),
    onSuccess: (r) => {
      setResult(r);
      navigator.vibrate?.(r.result === "ok" ? 80 : [60, 60, 60]);
      void queryClient.invalidateQueries({ queryKey: ["checkin-attendees", id] });
    },
  });
  const submitToken = useCallback(
    (value: string) => {
      const now = Date.now();
      // The camera sees the same code many times a second; ignore repeats for 3 s.
      if (
        lastToken.current &&
        lastToken.current.value === value &&
        now - lastToken.current.at < 3000
      )
        return;
      lastToken.current = { value, at: now };
      scan.mutate({ qrToken: value });
    },
    [scan],
  );

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  async function start() {
    if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    streamRef.current = stream;
    setScanning(true);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }

  useEffect(() => {
    if (!scanning || !window.BarcodeDetector) return;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    let alive = true;
    const tick = async () => {
      if (!alive || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        const value = codes[0]?.rawValue;
        if (value) submitToken(value);
      } catch {
        // frame not ready yet
      }
      if (alive) setTimeout(() => void tick(), 300);
    };
    void tick();
    return () => {
      alive = false;
    };
  }, [scanning, submitToken]);

  useEffect(() => stop, [stop]);

  const attendees = useQuery({
    queryKey: ["checkin-attendees", id, q],
    queryFn: () =>
      api.get(`/events/${id}/attendees?q=${encodeURIComponent(q)}`, z.array(attendeeSchema)),
    enabled: q.trim().length >= 2,
  });

  function manual(e: FormEvent) {
    e.preventDefault();
    if (code.trim()) scan.mutate({ qrToken: code.trim() });
    setCode("");
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t("checkin")}</h1>
      {result && <ResultBanner result={result} />}
      <div className={cn("overflow-hidden rounded-lg bg-black", !scanning && "hidden")}>
        <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
      </div>
      {scanning ? (
        <Button variant="outline" className="w-full" onClick={stop}>
          {t("stopScan")}
        </Button>
      ) : (
        <Button
          size="lg"
          className="w-full"
          onClick={() => void start().catch(() => setSupported(false))}
        >
          {t("scan")}
        </Button>
      )}
      {!supported && <p className="text-sm text-muted-foreground">{t("cameraUnsupported")}</p>}

      <form onSubmit={manual} className="flex gap-2">
        <Input
          placeholder={t("enterCode")}
          aria-label={t("enterCode")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="submit" disabled={scan.isPending}>
          {t("checkInNow")}
        </Button>
      </form>

      <Input
        placeholder={t("search")}
        aria-label={t("search")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="divide-y">
        {attendees.data?.map((a) => (
          <li key={a.ticketId} className="flex items-center justify-between gap-2 py-2 text-sm">
            <span>
              {a.holderName} · {a.tierName}
              <span className="block text-xs text-muted-foreground">
                {a.buyerPhone} · {a.orderCode}
              </span>
            </span>
            {a.checkedInAt ? (
              <span className="text-xs text-primary">✓</span>
            ) : (
              <Button
                size="sm"
                disabled={scan.isPending}
                onClick={() => scan.mutate({ ticketId: a.ticketId })}
              >
                {t("checkInNow")}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate>{() => <CheckIn id={id} />}</AuthGate>;
}

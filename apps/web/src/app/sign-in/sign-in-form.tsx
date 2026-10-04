"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const emailSchema = z.email();
const otpSchema = z.string().regex(/^\d{6}$/);

export function SignInForm() {
  const t = useTranslations("signIn");
  const tc = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email.trim().toLowerCase());
    if (!parsed.success) return setError(t("invalidEmail"));
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.emailOtp.sendVerificationOtp({
      email: parsed.data,
      type: "sign-in",
    });
    setBusy(false);
    if (err) return setError(err.message ?? tc("error"));
    setEmail(parsed.data);
    setStep("otp");
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (!otpSchema.safeParse(otp).success) return setError(t("invalidCode"));
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.signIn.emailOtp({ email, otp });
    setBusy(false);
    if (err) return setError(err.message ?? tc("error"));
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    router.push("/");
  }

  async function google() {
    setBusy(true);
    const { error: err } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    if (err) {
      setBusy(false);
      setError(err.message ?? tc("error"));
    }
  }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        disabled={busy}
        onClick={() => void google()}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
          />
        </svg>
        {t("google")}
      </Button>
      <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-border" />
        {t("or")}
        <span className="h-px flex-1 bg-border" />
      </div>

      {step === "email" ? (
        <form onSubmit={(e) => void sendCode(e)} className="space-y-3" noValidate>
          <label className="block space-y-1">
            <span className="text-sm font-medium">{t("email")}</span>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {t("sendCode")}
          </Button>
        </form>
      ) : (
        <form onSubmit={(e) => void verify(e)} className="animate-fade-up space-y-3" noValidate>
          <p className="rounded-xl bg-primary-soft p-3 text-sm text-primary-strong">
            ✉️ {t("codeSent", { email })}
          </p>
          <label className="block space-y-1">
            <span className="text-sm font-medium">{t("code")}</span>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="h-16 text-center font-display text-3xl font-extrabold tracking-[0.5em] placeholder:tracking-[0.5em]"
            />
          </label>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {t("verify")}
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={() => {
              setStep("email");
              setOtp("");
              setError(null);
            }}
          >
            {t("changeEmail")}
          </Button>
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="animate-fade-in rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

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
        {t("google")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">{t("or")}</p>

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
        <form onSubmit={(e) => void verify(e)} className="space-y-3" noValidate>
          <p className="text-sm text-muted-foreground">{t("codeSent", { email })}</p>
          <label className="block space-y-1">
            <span className="text-sm font-medium">{t("code")}</span>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
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
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

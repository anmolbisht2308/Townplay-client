"use client";

import { membershipSchema, type JoinMembershipRequest } from "@townplay/shared";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormError } from "@/components/form-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/use-me";
import { ApiError, api } from "@/lib/api";

/** Join a plan or batch: name + phone, then pay on the membership page. */
export function JoinForm({
  target,
  label,
  disabled,
}: {
  target: { planId: string } | { batchId: string };
  label: string;
  disabled?: boolean;
}) {
  const t = useTranslations("memberships");
  const router = useRouter();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const join = useMutation({
    mutationFn: (body: JoinMembershipRequest) =>
      api.send("POST", "/memberships", membershipSchema, body),
    onSuccess: (m) => router.push(`/memberships/${m.id}`),
  });

  if (disabled) return <p className="text-sm text-muted-foreground">{t("full")}</p>;
  if (!me.isPending && !me.data)
    return (
      <Link href="/sign-in" className={buttonVariants({ variant: "outline", className: "w-full" })}>
        {t("signIn")}
      </Link>
    );
  if (!open)
    return (
      <Button
        className="w-full"
        onClick={() => {
          setName((n) => n || me.data?.name || "");
          setPhone((p) => p || me.data?.phone || "");
          setOpen(true);
        }}
      >
        {label}
      </Button>
    );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    join.mutate({ ...target, member: { name: name.trim(), phone: phone.trim() } });
  };
  const known =
    join.error instanceof ApiError && join.error.code === "ALREADY_MEMBER"
      ? t("alreadyMember")
      : join.error instanceof ApiError && join.error.code === "BATCH_FULL"
        ? t("full")
        : null;
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label={t("yourName")}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
      </Field>
      <Field label={t("yourPhone")}>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          required
        />
      </Field>
      {known ? (
        <p className="text-sm text-destructive">{known}</p>
      ) : (
        <FormError error={join.error} labels={{ member: t("yourPhone") }} />
      )}
      <Button type="submit" className="w-full" disabled={join.isPending}>
        {label}
      </Button>
    </form>
  );
}

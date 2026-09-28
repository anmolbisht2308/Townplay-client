"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { getMe } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export function AccountCard() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: getMe });

  if (me.isPending) return <p className="text-muted-foreground">{tc("loading")}</p>;
  if (me.isError) return <p className="text-destructive">{tc("error")}</p>;
  if (!me.data) {
    return (
      <Link href="/sign-in" className={buttonVariants({ size: "lg" })}>
        {t("signIn")}
      </Link>
    );
  }

  async function signOut() {
    await authClient.signOut();
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="font-medium">{t("welcome", { name: me.data.name || me.data.email })}</p>
      <p className="text-sm text-muted-foreground">{me.data.email}</p>
      <p className="text-sm text-muted-foreground">
        {t("roles", { roles: me.data.roles.join(", ") })}
      </p>
      <Button variant="outline" onClick={() => void signOut()}>
        {t("signOut")}
      </Button>
    </div>
  );
}

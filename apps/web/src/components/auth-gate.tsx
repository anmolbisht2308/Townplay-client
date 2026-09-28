"use client";

import type { Me, Role } from "@townplay/shared";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";

/** Renders children only for a signed-in user (optionally with a role). */
export function AuthGate({ role, children }: { role?: Role; children: (me: Me) => ReactNode }) {
  const t = useTranslations();
  const me = useMe();
  if (me.isPending) return <p className="pt-6 text-muted-foreground">{t("common.loading")}</p>;
  if (me.isError) return <p className="pt-6 text-destructive">{t("common.error")}</p>;
  if (!me.data) {
    return (
      <div className="space-y-3 pt-6">
        <p>{t("owner.signInFirst")}</p>
        <Link href="/sign-in" className={buttonVariants()}>
          {t("home.signIn")}
        </Link>
      </div>
    );
  }
  if (role && !me.data.roles.includes(role)) {
    return <p className="pt-6 text-destructive">{t("admin.forbidden")}</p>;
  }
  return <>{children(me.data)}</>;
}

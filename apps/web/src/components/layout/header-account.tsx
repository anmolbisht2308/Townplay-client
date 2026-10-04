"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { UserIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";

/** Sign-in button or the signed-in user's initial (desktop header). */
export function HeaderAccount() {
  const t = useTranslations("nav");
  const me = useMe();
  if (me.isPending) return <span className="skeleton hidden h-9 w-9 rounded-full md:block" />;
  if (!me.data)
    return (
      <Link
        href="/sign-in"
        className={buttonVariants({ size: "sm", className: "hidden md:inline-flex" })}
      >
        {t("signIn")}
      </Link>
    );
  return (
    <Link
      href="/account"
      aria-label={t("account")}
      className="pressable hidden h-9 w-9 place-items-center rounded-full bg-primary-soft font-semibold text-primary-strong md:grid"
    >
      {me.data.name ? me.data.name.trim().charAt(0).toUpperCase() : <UserIcon size={18} />}
    </Link>
  );
}

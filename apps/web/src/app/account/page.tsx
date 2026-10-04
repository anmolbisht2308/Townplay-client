"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRightIcon,
  CalendarIcon,
  ShieldIcon,
  StoreIcon,
  TicketIcon,
  TrophyIcon,
  UserIcon,
} from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { authClient } from "@/lib/auth-client";

type Row = { href: string; label: string; icon: ComponentType<{ size?: number }> };

export default function AccountPage() {
  const t = useTranslations("home");
  const tn = useTranslations("nav");
  const queryClient = useQueryClient();
  const me = useMe();

  if (me.isPending)
    return (
      <section className="space-y-4 pt-6">
        <div className="skeleton h-28 w-full rounded-2xl" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
      </section>
    );

  if (!me.data)
    return (
      <section className="pt-10 text-center">
        <div className="animate-pop mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary-strong">
          <UserIcon size={30} />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold">{tn("accountTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{tn("accountSignedOut")}</p>
        <Link href="/sign-in" className={buttonVariants({ size: "lg", className: "mt-6" })}>
          {t("signIn")}
        </Link>
      </section>
    );

  const user = me.data;
  const rows: Row[] = [
    { href: "/bookings", label: t("myBookings"), icon: CalendarIcon },
    { href: "/tickets", label: t("myTickets"), icon: TicketIcon },
    { href: "/memberships", label: t("myMemberships"), icon: TrophyIcon },
    {
      href: "/owner",
      label: user.roles.includes("owner") ? tn("ownerDashboard") : t("ownerCta"),
      icon: StoreIcon,
    },
    ...(user.roles.includes("admin")
      ? [{ href: "/admin/review", label: tn("admin"), icon: ShieldIcon }]
      : []),
  ];

  async function signOut() {
    await authClient.signOut();
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  }

  return (
    <section className="space-y-5 pt-6">
      <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-foreground p-5 text-background">
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/40" />
        <div className="relative flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-energy font-display text-2xl font-extrabold text-energy-foreground">
            {(user.name || user.email).trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold">
              {t("welcome", { name: user.name || user.email })}
            </p>
            <p className="truncate text-sm opacity-70">{user.email}</p>
          </div>
        </div>
      </div>
      <ul className="overflow-hidden rounded-2xl border bg-card shadow-card">
        {rows.map((r, i) => {
          const Icon = r.icon;
          return (
            <li
              key={r.href}
              className="animate-fade-up border-b last:border-0"
              style={{ "--i": i + 1 } as React.CSSProperties}
            >
              <Link
                href={r.href}
                className="pressable flex items-center gap-3 px-4 py-4 hover:bg-accent"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary-strong">
                  <Icon size={19} />
                </span>
                <span className="flex-1 font-medium">{r.label}</span>
                <ArrowRightIcon size={18} className="text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
      <Button variant="outline" className="w-full" onClick={() => void signOut()}>
        {t("signOut")}
      </Button>
    </section>
  );
}

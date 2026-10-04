"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BallIcon,
  CalendarIcon,
  HomeIcon,
  SearchIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

function useItems(citySlug: string) {
  const t = useTranslations("nav");
  return [
    { href: "/", label: t("home"), icon: HomeIcon, match: (p: string) => p === "/" },
    {
      href: `/${citySlug}`,
      label: t("explore"),
      icon: SearchIcon,
      match: (p: string) => p === `/${citySlug}` || p.includes("/venues/"),
    },
    {
      href: `/${citySlug}/games`,
      label: t("games"),
      icon: UsersIcon,
      match: (p: string) => p.includes("/games"),
    },
    {
      href: `/${citySlug}/events`,
      label: t("events"),
      icon: BallIcon,
      match: (p: string) => p.includes("/events") || p.startsWith("/tickets"),
    },
    {
      href: "/bookings",
      label: t("bookings"),
      icon: CalendarIcon,
      match: (p: string) => p.startsWith("/bookings"),
    },
    {
      href: "/account",
      label: t("account"),
      icon: UserIcon,
      match: (p: string) => p.startsWith("/account") || p.startsWith("/memberships"),
    },
  ];
}

/** Desktop links in the header. */
export function HeaderNav({ citySlug }: { citySlug: string }) {
  const pathname = usePathname();
  const items = useItems(citySlug).slice(1, 5);
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {items.map((it) => {
        const active = it.match(pathname);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "pressable rounded-full px-3.5 py-2 text-sm font-medium",
              active
                ? "bg-primary-soft text-primary-strong"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Thumb-reach tab bar on phones. Hidden from md up, where the header carries the links. */
export function BottomNav({ citySlug }: { citySlug: string }) {
  const pathname = usePathname();
  const items = useItems(citySlug).filter((it) => it.href !== `/${citySlug}/events`);
  if (pathname.startsWith("/owner") || pathname.startsWith("/admin")) return null;
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Main"
    >
      <ul className="mx-auto grid h-[var(--bottom-nav-h)] max-w-md grid-cols-5">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-primary-strong" : "text-muted-foreground",
                )}
              >
                {active && (
                  <span className="animate-pop absolute top-1.5 h-8 w-12 rounded-full bg-primary-soft" />
                )}
                <Icon size={21} className="relative" strokeWidth={active ? 2.4 : 2} />
                <span className="relative">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

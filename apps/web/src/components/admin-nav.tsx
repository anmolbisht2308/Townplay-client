"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  ["/admin/review", "review"],
  ["/admin/payouts", "payouts"],
  ["/admin/settings", "settings"],
] as const;

export function AdminNav() {
  const t = useTranslations("admin");
  const pathname = usePathname();
  return (
    <nav className="mb-4 flex gap-2">
      {LINKS.map(([href, key]) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            pathname === href && "border-primary bg-primary text-primary-foreground",
          )}
        >
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}

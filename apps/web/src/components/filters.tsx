import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Segmented control made of links (works without JavaScript). */
export function Segmented({
  items,
  label,
}: {
  label: string;
  items: { href: string; label: string; active: boolean }[];
}) {
  return (
    <nav
      aria-label={label}
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-surface p-1"
    >
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.active ? "page" : undefined}
          className={cn(
            "pressable shrink-0 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap",
            it.active
              ? "bg-card text-foreground shadow-card"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

/** Horizontally scrolling row of filter chips (links). */
export function ChipRow({
  items,
  label,
}: {
  label: string;
  items: { href: string; label: ReactNode; active: boolean }[];
}) {
  return (
    <nav aria-label={label} className="scroller -mx-4 gap-2 px-4 py-1 md:mx-0 md:flex-wrap md:px-0">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.active ? "page" : undefined}
          className={cn(
            "pressable inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap",
            it.active
              ? "bg-primary-soft text-primary-strong"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

export function EmptyState({
  emoji,
  title,
  text,
  action,
}: {
  emoji: string;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-scale-in rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
      <p className="text-5xl" aria-hidden="true">
        {emoji}
      </p>
      <p className="mt-4 text-lg font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="animate-fade-up space-y-2">
      <p className="text-sm font-semibold text-primary-strong">{eyebrow}</p>
      <h1 className="text-3xl font-extrabold md:text-5xl">{title}</h1>
    </header>
  );
}

import type { ReactNode } from "react";

/** Page heading + empty state usable from client components (filters.tsx ones are server-only). */
export function PageHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <header className="animate-fade-up space-y-2">
      {eyebrow && <p className="text-sm font-semibold text-primary-strong">{eyebrow}</p>}
      <h1 className="text-3xl font-extrabold md:text-4xl">{title}</h1>
    </header>
  );
}

export function EmptyStateClient({
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
    <div className="animate-scale-in rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <p className="text-5xl" aria-hidden="true">
        {emoji}
      </p>
      <p className="mt-4 text-lg font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

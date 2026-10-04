import Link from "next/link";
import { BoltIcon } from "@/components/icons";

export function Logo({ name }: { name: string }) {
  return (
    <Link href="/" className="pressable group flex items-center gap-2" aria-label={name}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card transition-transform duration-300 group-hover:-rotate-6">
        <BoltIcon size={18} fill="currentColor" strokeWidth={1.5} />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">
        town<span className="text-primary">play</span>
      </span>
    </Link>
  );
}

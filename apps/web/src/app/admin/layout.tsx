import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin-nav";

export const metadata: Metadata = { robots: { index: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pt-4">
      <AdminNav />
      {children}
    </div>
  );
}

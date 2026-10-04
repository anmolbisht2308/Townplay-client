import type { ReactNode } from "react";

/**
 * Re-mounts on every navigation, so each page fades up in (CSS only). Direct children are
 * centred at reading width unless they set data-wide (listings, home, venue page).
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter page-shell">{children}</div>;
}

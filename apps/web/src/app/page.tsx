import { cityResponseSchema } from "@townplay/shared";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { z } from "zod";
import { buttonVariants } from "@/components/ui/button";
import { serverGet } from "@/lib/server-api";
import { AccountCard } from "./account-card";

export default async function HomePage() {
  const t = await getTranslations("home");
  const cities = await serverGet("/cities", z.array(cityResponseSchema), 300).catch(() => []);
  return (
    <section className="space-y-6 pt-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="flex flex-col gap-2">
        {cities.map((c) => (
          <Link key={c.id} href={`/${c.slug}`} className={buttonVariants({ size: "lg" })}>
            {t("explore", { city: c.name })}
          </Link>
        ))}
        <Link href="/bookings" className={buttonVariants({ variant: "outline" })}>
          {t("myBookings")}
        </Link>
        <Link href="/tickets" className={buttonVariants({ variant: "outline" })}>
          {t("myTickets")}
        </Link>
        <Link href="/memberships" className={buttonVariants({ variant: "outline" })}>
          {t("myMemberships")}
        </Link>
        <Link href="/owner" className={buttonVariants({ variant: "outline" })}>
          {t("ownerCta")}
        </Link>
      </div>
      <AccountCard />
    </section>
  );
}

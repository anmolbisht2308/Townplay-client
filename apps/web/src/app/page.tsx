import { getTranslations } from "next-intl/server";
import { AccountCard } from "./account-card";

export default async function HomePage() {
  const t = await getTranslations("home");
  return (
    <section className="space-y-6 pt-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AccountCard />
    </section>
  );
}

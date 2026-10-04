import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BoltIcon } from "@/components/icons";
import { SignInForm } from "./sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signIn");
  return { title: t("title"), robots: { index: false } };
}

export default async function SignInPage() {
  const t = await getTranslations("signIn");
  return (
    <section className="mx-auto max-w-md pt-8 md:pt-14">
      <div className="animate-scale-in relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-lift md:p-8">
        <div
          aria-hidden="true"
          className="animate-drift pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,oklch(0.93_0.19_118/0.55),transparent_65%)]"
        />
        <div className="relative space-y-6">
          <div className="space-y-3">
            <span className="animate-pop grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-card">
              <BoltIcon size={22} fill="currentColor" strokeWidth={1.5} />
            </span>
            <h1 className="text-3xl font-extrabold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          <SignInForm />
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">{t("terms")}</p>
    </section>
  );
}

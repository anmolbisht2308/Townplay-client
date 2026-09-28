import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignInForm } from "./sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signIn");
  return { title: t("title") };
}

export default async function SignInPage() {
  const t = await getTranslations("signIn");
  return (
    <section className="mx-auto max-w-sm space-y-6 pt-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <SignInForm />
    </section>
  );
}

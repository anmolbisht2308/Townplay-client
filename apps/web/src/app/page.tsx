import {
  cityResponseSchema,
  eventListResponseSchema,
  gameCardSchema,
  venueListResponseSchema,
  type Sport,
} from "@townplay/shared";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { z } from "zod";
import { EventCard } from "@/components/events/event-card";
import { GameCard } from "@/components/games/game-card";
import {
  ArrowRightIcon,
  BallIcon,
  CalendarIcon,
  CheckIcon,
  SearchIcon,
  ShieldIcon,
  TrophyIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { VenueCard } from "@/components/venue-card";
import { clientEnv } from "@/env";
import { serverGet } from "@/lib/server-api";

const QUICK_SPORTS: Sport[] = ["football", "badminton", "box_cricket", "pickleball", "tennis"];
const MARQUEE: Sport[] = [
  "football",
  "badminton",
  "box_cricket",
  "pickleball",
  "tennis",
  "table_tennis",
  "basketball",
  "swimming",
  "snooker",
  "skating",
];
const EMOJI: Partial<Record<Sport, string>> = {
  football: "⚽",
  badminton: "🏸",
  box_cricket: "🏏",
  pickleball: "🏓",
  tennis: "🎾",
  table_tennis: "🏓",
  basketball: "🏀",
  swimming: "🏊",
  snooker: "🎱",
  skating: "⛸️",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: { absolute: `${t("common.appName")} · ${t("common.tagline")}` },
    description: t("home.metaDescription"),
    alternates: { canonical: "/" },
  };
}

const delay = (i: number) => ({ "--i": i }) as CSSProperties;

function SectionHead({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-2xl font-extrabold md:text-3xl">{title}</h2>
      <Link
        href={href}
        className="pressable group flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-strong"
      >
        {cta}
        <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

function Scroller({ children }: { children: ReactNode }) {
  return (
    <div className="scroller -mx-4 gap-4 px-4 pt-1 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
      {children}
    </div>
  );
}

export default async function HomePage() {
  const t = await getTranslations();
  const cities = await serverGet("/cities", z.array(cityResponseSchema), 300).catch(() => []);
  const city = cities[0] ?? { slug: "bareilly", name: "Bareilly", id: "", state: "" };
  const [venues, events, games] = await Promise.all([
    serverGet(`/cities/${city.slug}/venues?limit=6`, venueListResponseSchema, 120)
      .then((r) => r.items)
      .catch(() => []),
    serverGet(`/cities/${city.slug}/events?limit=6`, eventListResponseSchema, 120)
      .then((r) => r.items)
      .catch(() => []),
    serverGet(`/cities/${city.slug}/games`, z.array(gameCardSchema), 60).catch(() => []),
  ]);
  const base = `/${city.slug}`;
  const site = clientEnv.NEXT_PUBLIC_SITE_URL;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: t("common.appName"),
      url: site,
      potentialAction: {
        "@type": "SearchAction",
        target: `${site}${base}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: t("common.appName"),
      url: site,
      logo: `${site}/icon.svg`,
    },
  ];

  const tiles = [
    {
      href: base,
      icon: CalendarIcon,
      title: t("home.tileCourts"),
      desc: t("home.tileCourtsDesc"),
      tone: "bg-primary text-primary-foreground",
    },
    {
      href: `${base}/games`,
      icon: UsersIcon,
      title: t("home.tileGames"),
      desc: t("home.tileGamesDesc"),
      tone: "bg-energy text-energy-foreground",
    },
    {
      href: `${base}/events`,
      icon: BallIcon,
      title: t("home.tileEvents"),
      desc: t("home.tileEventsDesc"),
      tone: "bg-foreground text-background",
    },
    {
      href: `${base}?category=club`,
      icon: TrophyIcon,
      title: t("home.tileCoaching"),
      desc: t("home.tileCoachingDesc"),
      tone: "bg-primary-soft text-primary-strong",
    },
  ];

  return (
    <div data-wide className="space-y-16 pb-4 md:space-y-24">
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* ---------- hero ---------- */}
      <section className="relative -mx-4 overflow-hidden px-4 pt-8 pb-4 md:mx-0 md:rounded-[2rem] md:px-12 md:pt-16 md:pb-14">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="animate-drift absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,oklch(0.85_0.17_148/0.55),transparent_65%)]" />
          <div
            className="animate-drift absolute top-10 -right-28 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.93_0.19_118/0.6),transparent_65%)]"
            style={{ animationDelay: "-6s" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.2_0.02_260/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.2_0.02_260/0.04)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,black_40%,transparent_75%)] bg-[size:36px_36px]" />
        </div>

        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[1.15fr_1fr]">
          <div className="min-w-0 space-y-6">
            <p
              className="animate-fade-up inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur"
              style={delay(0)}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {t("home.eyebrow", { city: city.name })}
            </p>
            {/* Headline and subtitle render without an entry animation: they are the LCP. */}
            <h1 className="text-[2.6rem] leading-[1.02] font-extrabold md:text-7xl">
              {t.rich("home.heroTitle", {
                city: city.name,
                mark: (c) => <span className="marker">{c}</span>,
              })}
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground md:text-xl">
              {t("home.heroSubtitle")}
            </p>

            {/* Plain GET form: search works before JavaScript loads. */}
            <form
              action={base}
              className="animate-fade-up flex max-w-lg items-center gap-2 rounded-2xl border bg-card p-2 shadow-lift focus-within:ring-4 focus-within:ring-primary/15"
              style={delay(3)}
              role="search"
            >
              <SearchIcon size={20} className="ml-2 shrink-0 text-muted-foreground" />
              <input
                name="q"
                placeholder={t("home.searchPlaceholder")}
                aria-label={t("home.searchPlaceholder")}
                className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" className={buttonVariants({ className: "shrink-0" })}>
                {t("home.searchButton")}
              </button>
            </form>

            <ul className="animate-fade-up flex flex-wrap gap-2" style={delay(4)}>
              {QUICK_SPORTS.map((s) => (
                <li key={s}>
                  <Link
                    href={`${base}?sport=${s}`}
                    className="pressable inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-2 text-sm font-medium shadow-sm hover:border-primary hover:text-primary-strong"
                  >
                    <span aria-hidden="true">{EMOJI[s]}</span>
                    {t(`sports.${s}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Floating "live" cards: pure HTML/CSS, no images to download. */}
          <div aria-hidden="true" className="relative mx-auto h-72 w-full max-w-sm md:h-96">
            <div
              className="animate-scale-in absolute inset-x-6 top-4 bottom-4 rotate-3 rounded-[2rem] bg-[linear-gradient(150deg,var(--primary),var(--primary-strong))] shadow-lift md:inset-x-10"
              style={delay(2)}
            >
              <div className="absolute inset-0 rounded-[2rem] bg-[repeating-linear-gradient(90deg,transparent_0_22px,oklch(1_0_0/0.07)_22px_44px)]" />
              <div className="absolute inset-x-8 top-1/2 h-px bg-white/30" />
              <div className="absolute top-1/2 left-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl">
                ⚽
              </span>
            </div>
            <div className="animate-fade-up absolute top-0 -left-1 md:-left-6" style={delay(4)}>
              <div className="animate-float flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-lift">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
                  <CheckIcon size={18} strokeWidth={3} />
                </span>
                <div className="text-left">
                  <p className="text-sm font-bold">{t("home.mockConfirmed")}</p>
                  <p className="text-xs text-muted-foreground">{t("home.mockSlot")}</p>
                </div>
              </div>
            </div>
            <div
              className="animate-fade-up absolute -right-1 bottom-10 md:-right-8"
              style={delay(6)}
            >
              <div
                className="animate-float flex items-center gap-3 rounded-2xl bg-foreground px-4 py-3 text-background shadow-lift"
                style={{ animationDelay: "-2s" }}
              >
                <div className="flex -space-x-2">
                  {["A", "R", "N"].map((c, i) => (
                    <span
                      key={c}
                      className="grid h-8 w-8 place-items-center rounded-full border-2 border-foreground text-xs font-bold"
                      style={{
                        background: [
                          "var(--energy)",
                          "oklch(0.75 0.13 230)",
                          "oklch(0.78 0.14 50)",
                        ][i],
                        color: "var(--energy-foreground)",
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-semibold">{t("home.mockPlayers")}</p>
              </div>
            </div>
            <div className="animate-fade-up absolute bottom-0 left-4" style={delay(8)}>
              <span className="animate-pop inline-flex items-center gap-1 rounded-full bg-energy px-3 py-1.5 text-xs font-bold text-energy-foreground shadow-card">
                ⚡ {t("home.mockSpots")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- sports marquee ---------- */}
      <div
        aria-hidden="true"
        className="-mx-4 -mt-8 overflow-hidden border-y bg-foreground py-3 text-background md:-mt-14 md:rounded-2xl md:border-0"
      >
        <div className="animate-marquee flex w-max gap-8 pr-8 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((s, i) => (
            <span key={i} className="flex items-center gap-2 font-display text-lg font-bold">
              <span>{EMOJI[s]}</span>
              {t(`sports.${s}`)}
              <span className="text-energy">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ---------- what you can do ---------- */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {tiles.map((tile, i) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className={`reveal lift group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-card md:min-h-48 md:p-5 ${tile.tone}`}
              style={delay(i)}
            >
              <span className="absolute -right-8 -bottom-8 h-28 w-28 rounded-full bg-current opacity-10 transition-transform duration-500 group-hover:scale-125" />
              <Icon size={26} />
              <div className="relative space-y-1">
                <h2 className="text-lg leading-tight font-extrabold md:text-xl">{tile.title}</h2>
                <p className="text-xs leading-snug opacity-80 md:text-sm">{tile.desc}</p>
              </div>
            </Link>
          );
        })}
      </section>

      {/* ---------- live listings ---------- */}
      {venues.length > 0 && (
        <section className="space-y-5">
          <SectionHead
            title={t("home.venuesTitle", { city: city.name })}
            href={base}
            cta={t("home.seeAll")}
          />
          <Scroller>
            {venues.map((v, i) => (
              <VenueCard
                key={v.id}
                venue={v}
                citySlug={city.slug}
                priority={i < 2}
                className="reveal w-[78%] shrink-0 sm:w-[45%] md:w-auto"
              />
            ))}
          </Scroller>
        </section>
      )}

      {games.length > 0 && (
        <section className="space-y-5">
          <SectionHead title={t("home.gamesTitle")} href={`${base}/games`} cta={t("home.seeAll")} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {games.slice(0, 4).map((g) => (
              <GameCard key={g.id} game={g} className="reveal" />
            ))}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="space-y-5">
          <SectionHead
            title={t("home.eventsTitle")}
            href={`${base}/events`}
            cta={t("home.seeAll")}
          />
          <Scroller>
            {events.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                citySlug={city.slug}
                className="reveal w-[78%] shrink-0 sm:w-[45%] md:w-auto"
              />
            ))}
          </Scroller>
        </section>
      )}

      {/* ---------- how it works ---------- */}
      <section className="reveal space-y-6">
        <h2 className="text-center text-3xl font-extrabold md:text-4xl">
          {t.rich("home.howTitle", { mark: (c) => <span className="marker">{c}</span> })}
        </h2>
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-5">
          {(["pick", "pay", "play"] as const).map((step, i) => (
            <li
              key={step}
              className="reveal relative overflow-hidden rounded-2xl border bg-card p-5 shadow-card"
            >
              <span className="absolute -top-3 -right-1 font-display text-8xl font-extrabold text-primary/10">
                {i + 1}
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-xl">
                {["📅", "💳", "🏆"][i]}
              </span>
              <h3 className="mt-4 text-xl font-bold">{t(`home.step.${step}`)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(`home.step.${step}Desc`)}</p>
            </li>
          ))}
        </ol>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground">
          {[
            { icon: CheckIcon, label: t("home.trustInstant") },
            { icon: ShieldIcon, label: t("home.trustSecure") },
            { icon: WalletIcon, label: t("home.trustRefund") },
          ].map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-soft text-primary-strong">
                <Icon size={14} strokeWidth={2.6} />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- owners ---------- */}
      <section className="reveal relative overflow-hidden rounded-[2rem] bg-foreground px-6 py-10 text-background md:px-14 md:py-14">
        <div
          aria-hidden="true"
          className="animate-drift absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,oklch(0.56_0.17_148/0.7),transparent_65%)]"
        />
        <div className="relative max-w-xl space-y-4">
          <span className="inline-flex rounded-full bg-energy px-3 py-1 text-xs font-bold text-energy-foreground">
            {t("home.ownerBadge")}
          </span>
          <h2 className="text-3xl leading-tight font-extrabold md:text-5xl">
            {t("home.ownerTitle")}
          </h2>
          <p className="text-base opacity-75 md:text-lg">{t("home.ownerText")}</p>
          <Link href="/owner" className={buttonVariants({ variant: "energy", size: "lg" })}>
            {t("home.ownerCta")}
            <ArrowRightIcon size={18} />
          </Link>
        </div>
      </section>

      <footer className="flex flex-col items-center gap-2 border-t pt-8 text-center text-sm text-muted-foreground">
        <p className="font-display text-lg font-bold text-foreground">{t("common.appName")}</p>
        <p>{t("home.footer", { city: city.name })}</p>
      </footer>
    </div>
  );
}

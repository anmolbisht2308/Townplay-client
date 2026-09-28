import * as Sentry from "@sentry/nextjs";
import { clientEnv } from "./env";

if (clientEnv.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({ dsn: clientEnv.NEXT_PUBLIC_SENTRY_DSN, tracesSampleRate: 0.1 });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

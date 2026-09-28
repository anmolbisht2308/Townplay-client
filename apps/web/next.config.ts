import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { parseServerEnv } from "./src/env";

const env = parseServerEnv(process.env);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The api is reached through this rewrite so auth cookies are first-party on the web origin.
  async rewrites() {
    return [{ source: "/v1/:path*", destination: `${env.API_URL}/v1/:path*` }];
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);

import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** better-auth lives on the api at /v1/auth, reached through the same-origin rewrite. */
export const authClient = createAuthClient({
  basePath: "/v1/auth",
  plugins: [emailOTPClient()],
});

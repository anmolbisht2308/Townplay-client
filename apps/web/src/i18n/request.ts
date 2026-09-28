import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, toLocale } from "./config";

// No locale in the URL (city pages stay /bareilly); the language lives in a cookie.
export default getRequestConfig(async () => {
  const locale = toLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const messages = (await import(`../../messages/${locale}.json`)) as { default: IntlMessages };
  return { locale, messages: messages.default, timeZone: "Asia/Kolkata" };
});

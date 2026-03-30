import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { locales } from "@/i18n/config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("locale")?.value;
  const locale =
    rawLocale && (locales as readonly string[]).includes(rawLocale)
      ? rawLocale
      : "ja";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

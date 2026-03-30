import { format } from "date-fns";
import { ja, enUS } from "date-fns/locale";

const localeMap: Record<string, typeof ja> = {
  ja,
  en: enUS,
};

export const formatDate = (
  date: Date | string,
  locale: string,
  pattern?: string,
): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const dateLocale = localeMap[locale] ?? ja;

  if (pattern) {
    return format(d, pattern, { locale: dateLocale });
  }

  if (locale === "en") {
    return format(d, "MMM dd, yyyy", { locale: dateLocale });
  }

  return format(d, "yyyy年MM月dd日", { locale: dateLocale });
};

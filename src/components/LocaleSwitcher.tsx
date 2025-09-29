"use client";

import { usePathname, useRouter } from "next/navigation";
import { routing } from "~/i18n/routing";
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

// Infer the union type from routing.locales
type Locale = (typeof routing.locales)[number];

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;

  function onSelect(newLocale: Locale) {
    if (!pathname) return;

    const segments = pathname.split("/");

    // If first path segment is already a locale, replace it
    if (routing.locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      // Otherwise insert it
      segments.splice(1, 0, newLocale);
    }

    router.push(segments.join("/"));
  }

  return (
    <Select value={locale} onValueChange={(val) => onSelect(val as Locale)}>
      <SelectTrigger className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {loc.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

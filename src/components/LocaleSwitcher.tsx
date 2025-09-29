"use client";

import { usePathname, useRouter } from "next/navigation";
import { routing } from "~/i18n/routing"; // your locales list
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  function onSelect(newLocale: (typeof routing.locales)[number]) {
    if (!pathname) return;

    const segments = pathname.split("/");
    if (routing.locales.includes(segments[1] as any)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }

    router.push(segments.join("/"));
  }

  return (
    <Select value={locale} onValueChange={onSelect}>
      <SelectTrigger className="w-20">
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

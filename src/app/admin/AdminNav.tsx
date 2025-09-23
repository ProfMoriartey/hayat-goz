"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "~/components/ui/navigation-menu";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/doctors", label: "Doctors" },
  { href: "/admin/appointment-types", label: "Appointment Types" },
  { href: "/admin/availability", label: "Weekly Availability" },
  { href: "/admin/exceptions", label: "Exceptions / Closures" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <NavigationMenu orientation="vertical" className="w-full">
      <NavigationMenuList className="w-full flex-col items-start space-y-1">
        {items.map((it) => {
          const active =
            pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <NavigationMenuItem key={it.href} className="w-full">
              <NavigationMenuLink asChild>
                <Link
                  href={it.href}
                  className={cn(
                    "block w-full rounded px-3 py-2 text-sm",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {it.label}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

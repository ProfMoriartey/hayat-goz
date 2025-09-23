// src/components/admin/AdminNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/doctors", label: "Doctors" },
  { href: "/admin/appointment-types", label: "Appointment Types" },
  { href: "/admin/availabilities", label: "Weekly Availability" },
  { href: "/admin/exceptions", label: "Exceptions / Closures" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1 p-4">
      {items.map((it) => {
        const active =
          pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={clsx(
              "block rounded px-3 py-2 text-sm",
              active ? "bg-gray-900 text-white" : "hover:bg-gray-100",
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

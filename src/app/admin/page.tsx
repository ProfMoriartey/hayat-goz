import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

// import { redirect } from "next/navigation";
// import { checkRole } from "~/utils/roles";
// import { SearchUsers } from "./SearchUsers";
// import { clerkClient } from "@clerk/nextjs/server";
// import { removeRole, setRole } from "./_actions";
// import { SignedOut, UserButton } from "@clerk/nextjs";

const links = [
  {
    href: "/admin/doctors",
    title: "Doctors",
    desc: "Add doctors and their profiles.",
  },
  {
    href: "/admin/appointment-types",
    title: "Appointment Types",
    desc: "Durations & buffers.",
  },
  {
    href: "/admin/availabilities",
    title: "Weekly Availability",
    desc: "Recurring working hours.",
  },
  {
    href: "/admin/appointments",
    title: "Appointments",
    desc: "Appointments booked by patients",
  },
];

export default async function AdminDashboard() {
  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((c) => (
            <Link key={c.href} href={c.href}>
              <Card className="transition hover:shadow-md">
                <CardHeader>
                  <CardTitle>{c.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{c.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

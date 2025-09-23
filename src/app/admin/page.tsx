import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

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
    href: "/admin/exceptions",
    title: "Exceptions",
    desc: "Vacations, holidays, closures.",
  },
];

export default function AdminHome() {
  return (
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
  );
}

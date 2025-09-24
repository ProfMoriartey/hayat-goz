import type { ReactNode } from "react";
import RoleGate from "~/components/auth/RoleGate";
import AdminNav from "~/components/admin/AdminNav";
import { Card } from "~/components/ui/card";
import { UserButton } from "@clerk/nextjs";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate allowed={["ADMIN", "RECEPTION", "DOCTOR"]}>
      <div className="grid min-h-screen grid-cols-12">
        <aside className="col-span-12 border-r bg-white md:col-span-3 lg:col-span-2">
          <div className="border-b p-4">
            <h1 className="text-lg font-semibold">Clinic Admin</h1>
            <UserButton />
            <p className="text-muted-foreground text-xs">
              Scheduling & Content
            </p>
          </div>
          <AdminNav />
        </aside>
        <main className="col-span-12 p-6 md:col-span-9 lg:col-span-10">
          <Card className="p-6">{children}</Card>
        </main>
      </div>
    </RoleGate>
  );
}

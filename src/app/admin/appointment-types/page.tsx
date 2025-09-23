"use client";

import { AppointmentTypeTable } from "./table";

export default function AppointmentTypesPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Appointment Types</h1>
      <AppointmentTypeTable />
    </div>
  );
}

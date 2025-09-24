"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { DoctorTable } from "./table";
import { DoctorDialog } from "./doctor-dialog";

export default function DoctorsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Doctors</h2>
        <Button onClick={() => setOpen(true)}>+ Add Doctor</Button>
      </div>

      <Card className="p-4">
        <DoctorTable />
      </Card>

      <DoctorDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

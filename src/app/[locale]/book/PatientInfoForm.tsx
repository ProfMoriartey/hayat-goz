"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type Patient = {
  fullName: string;
  phone: string;
  email?: string;
};

export function PatientInfoForm({
  onComplete,
  initial,
}: {
  onComplete: (patient: Patient) => void;
  initial?: Patient | null;
}) {
  const [form, setForm] = useState<Patient>({
    fullName: initial?.fullName ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.phone) {
      alert("Name and phone are required");
      return;
    }
    onComplete(form);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}

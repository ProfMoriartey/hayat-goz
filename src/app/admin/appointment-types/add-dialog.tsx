"use client";

import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

const AppointmentTypeSchema = z.object({
  name: z.string().min(2),
  durationMin: z.number().min(1),
  bufferBeforeMin: z.number().min(0),
  bufferAfterMin: z.number().min(0),
});

export function AddAppointmentTypeDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    durationMin: "",
    bufferBeforeMin: "",
    bufferAfterMin: "",
  });

  async function handleSubmit() {
    try {
      const parsed = AppointmentTypeSchema.parse({
        name: form.name,
        durationMin: Number(form.durationMin),
        bufferBeforeMin: Number(form.bufferBeforeMin) || 0,
        bufferAfterMin: Number(form.bufferAfterMin) || 0,
      });

      await fetch("/api/appointment-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      setOpen(false);
      window.location.reload(); // quick refresh for now
    } catch (err) {
      console.error("Error creating appointment type:", err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Appointment Type</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Appointment Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={form.durationMin}
              onChange={(e) =>
                setForm({ ...form, durationMin: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Buffer Before (minutes)</Label>
            <Input
              type="number"
              value={form.bufferBeforeMin}
              onChange={(e) =>
                setForm({ ...form, bufferBeforeMin: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Buffer After (minutes)</Label>
            <Input
              type="number"
              value={form.bufferAfterMin}
              onChange={(e) =>
                setForm({ ...form, bufferAfterMin: e.target.value })
              }
            />
          </div>
          <Button onClick={handleSubmit}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

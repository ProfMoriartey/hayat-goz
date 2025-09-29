"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function AddAvailabilityDialog({
  open,
  onOpenChange,
  doctorId,
  dayOfWeek,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  doctorId: string;
  dayOfWeek: number;
}) {
  const [form, setForm] = useState({
    startTime: "09:00",
    endTime: "17:00",
    slotSizeMin: "20",
  });

  async function handleSave() {
    try {
      await fetch("/api/availabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          dayOfWeek,
          startTime: form.startTime,
          endTime: form.endTime,
          slotSizeMin: Number(form.slotSizeMin),
        }),
      });

      onOpenChange(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Availability</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Start Time (HH:MM)</Label>
            <Input
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          <div>
            <Label>End Time (HH:MM)</Label>
            <Input
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <div>
            <Label>Slot Size (minutes)</Label>
            <Input
              type="number"
              value={form.slotSizeMin}
              onChange={(e) =>
                setForm({ ...form, slotSizeMin: e.target.value })
              }
            />
          </div>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

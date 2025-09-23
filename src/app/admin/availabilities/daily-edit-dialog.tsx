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

type Availability = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  slotSizeMin: number;
};

export function EditDailyDialog({
  open,
  onOpenChange,
  availability,
  doctorId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  availability: Availability;
  doctorId: string;
}) {
  const [form, setForm] = useState({
    startTime: availability.startTime,
    endTime: availability.endTime,
    slotSizeMin: String(availability.slotSizeMin),
  });

  async function handleSave() {
    await fetch(`/api/daily-availabilities/${availability.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId,
        date: availability.date,
        startTime: form.startTime,
        endTime: form.endTime,
        slotSizeMin: Number(form.slotSizeMin),
      }),
    });
    onOpenChange(false);
    window.location.reload();
  }

  async function handleDelete() {
    await fetch(`/api/daily-availabilities/${availability.id}`, {
      method: "DELETE",
    });
    onOpenChange(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Availability for {availability.date}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Start Time</Label>
            <Input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          <div>
            <Label>End Time</Label>
            <Input
              type="time"
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
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

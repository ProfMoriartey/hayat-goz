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

export function AddDailyDialog({
  open,
  onOpenChange,
  doctorId,
  date,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  doctorId: string;
  date: string;
}) {
  const [form, setForm] = useState({
    startTime: "09:00",
    endTime: "17:00",
    slotSizeMin: "20",
  });

  async function handleSave() {
    await fetch("/api/daily-availabilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId,
        date,
        startTime: form.startTime,
        endTime: form.endTime,
        slotSizeMin: Number(form.slotSizeMin),
      }),
    });
    onOpenChange(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Availability for {date}</DialogTitle>
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
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

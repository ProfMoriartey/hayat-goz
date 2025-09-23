"use client";

import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

const Schema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  slotSizeMin: z.number().min(5),
});

export function EditWeeklyDialog({
  open,
  onOpenChange,
  availability,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  availability: {
    id: string;
    startTime: string;
    endTime: string;
    slotSizeMin: number;
  };
}) {
  const [form, setForm] = useState({
    startTime: availability.startTime,
    endTime: availability.endTime,
    slotSizeMin: String(availability.slotSizeMin),
  });

  async function handleSave() {
    try {
      const parsed = Schema.parse({
        startTime: form.startTime,
        endTime: form.endTime,
        slotSizeMin: Number(form.slotSizeMin),
      });

      await fetch(`/api/availabilities/${availability.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
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
          <DialogTitle>Edit Availability</DialogTitle>
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

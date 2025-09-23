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

type Window = { start: string; end: string };

export function EditExceptionDialog({
  open,
  onOpenChange,
  exception,
  doctorId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exception: {
    id: string;
    date: string;
    windows: string | null;
    isClosed: boolean;
  };
  doctorId: string;
}) {
  // Parse existing string windows into array of {start,end}
  const initialWindows: Window[] = exception.windows
    ? exception.windows.split(",").map((w) => {
        const [start, end] = w.trim().split("-");
        return { start: start || "", end: end || "" }; // ensures string
      })
    : [];

  const [windows, setWindows] = useState<Window[]>(initialWindows);

  function updateWindow(index: number, field: keyof Window, value: string) {
    const copy = [...windows];
    copy[index] = { ...copy[index], [field]: value } as Window;
    setWindows(copy);
  }

  function addWindow() {
    setWindows([...windows, { start: "", end: "" }]);
  }

  function removeWindow(index: number) {
    setWindows(windows.filter((_, i) => i !== index));
  }

  async function handleSave() {
    // Convert back into DB string "HH:MM-HH:MM, HH:MM-HH:MM"
    const windowsStr = windows
      .filter((w) => w.start && w.end)
      .map((w) => `${w.start}-${w.end}`)
      .join(", ");

    await fetch(`/api/availability-exceptions/${exception.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId,
        date: exception.date,
        isClosed: windowsStr.length === 0, // no windows = closed
        windows: windowsStr || null,
      }),
    });

    onOpenChange(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Exception Windows</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {windows.map((w, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div>
                <Label>Start</Label>
                <Input
                  type="time"
                  value={w.start}
                  onChange={(e) => updateWindow(idx, "start", e.target.value)}
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  type="time"
                  value={w.end}
                  onChange={(e) => updateWindow(idx, "end", e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeWindow(idx)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addWindow}>
            + Add Window
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

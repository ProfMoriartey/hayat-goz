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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

// Helper: convert UTC ISO string -> local datetime-local input value
function toLocalInputValue(dateString: string) {
  const d = new Date(dateString);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

type Appointment = {
  id: string;
  doctorName: string | null;
  typeName: string | null;
  startTime: string;
  status: string;
};

export function EditAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  refresh,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  appointment: Appointment;
  refresh: () => void;
}) {
  const [status, setStatus] = useState(appointment.status);
  const [startTime, setStartTime] = useState(
    toLocalInputValue(appointment.startTime),
  );
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUtc: new Date(startTime).toISOString(), // convert back to UTC
          status,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      refresh();
      onOpenChange(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Start Time</label>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="NO_SHOW">No-show</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

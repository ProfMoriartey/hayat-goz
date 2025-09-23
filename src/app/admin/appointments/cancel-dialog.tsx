"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  appointmentId,
  refresh,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  appointmentId: string;
  refresh: () => void;
}) {
  async function handleCancel() {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to cancel");
      refresh();
      onOpenChange(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unexpected error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Appointment</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Are you sure you want to cancel this appointment?
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            No
          </Button>
          <Button variant="destructive" onClick={handleCancel}>
            Yes, Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

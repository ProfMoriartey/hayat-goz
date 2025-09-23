"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

export function RemoveAppointmentDialog({
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
  async function handleRemove() {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove");
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
          <DialogTitle>Remove Appointment</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          This will permanently delete the appointment. Are you sure?
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            No
          </Button>
          <Button variant="destructive" onClick={handleRemove}>
            Yes, Remove
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

export function DeleteAppointmentTypeDialog({
  open,
  onOpenChange,
  appointmentTypeId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentTypeId: string;
}) {
  async function handleDelete() {
    try {
      await fetch(`/api/appointment-types/${appointmentTypeId}`, {
        method: "DELETE",
      });
      onOpenChange(false);
      window.location.reload();
    } catch (err) {
      console.error("Error deleting appointment type:", err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Appointment Type</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to delete this appointment type?</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

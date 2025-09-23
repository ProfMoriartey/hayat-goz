"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { EditAppointmentTypeDialog } from "./edit-dialog";
import { DeleteAppointmentTypeDialog } from "./delete-dialog";
import { AddAppointmentTypeDialog } from "./add-dialog";

const ApiResponseSchema = z.object({
  types: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      durationMin: z.number(),
      bufferBeforeMin: z.number(),
      bufferAfterMin: z.number(),
    }),
  ),
});

export type AppointmentType = z.infer<
  typeof ApiResponseSchema
>["types"][number];

export function AppointmentTypeTable() {
  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [editType, setEditType] = useState<AppointmentType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/appointment-types");
        if (!res.ok) throw new Error("Failed to load appointment types");

        const json = (await res.json()) as unknown;
        const data = ApiResponseSchema.parse(json);
        setTypes(data.types);
      } catch (err) {
        console.error("Error loading appointment types:", err);
      }
    })();
  }, []);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <AddAppointmentTypeDialog />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Duration (min)</TableHead>
            <TableHead>Buffer Before</TableHead>
            <TableHead>Buffer After</TableHead>
            <TableHead className="w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {types.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.name}</TableCell>
              <TableCell>{t.durationMin}</TableCell>
              <TableCell>{t.bufferBeforeMin}</TableCell>
              <TableCell>{t.bufferAfterMin}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mr-2"
                  onClick={() => setEditType(t)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteId(t.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editType && (
        <EditAppointmentTypeDialog
          open={!!editType}
          onOpenChange={(o) => !o && setEditType(null)}
          appointmentType={editType}
        />
      )}

      {deleteId && (
        <DeleteAppointmentTypeDialog
          open={!!deleteId}
          onOpenChange={(o) => !o && setDeleteId(null)}
          appointmentTypeId={deleteId}
        />
      )}
    </>
  );
}

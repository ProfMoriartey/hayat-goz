"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { EditDoctorDialog } from "./edit-dialog";
import { DeleteDoctorDialog } from "./delete-dialog";

type Doctor = {
  id: string;
  displayName: string;
  specialties: string | null;
  languages: string | null;
};

export function DoctorTable() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/doctors")
      .then((res) => res.json())
      .then((data) => setDoctors(data.doctors));
  }, []);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Specialties</TableHead>
            <TableHead>Languages</TableHead>
            <TableHead className="w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {doctors.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{doc.displayName}</TableCell>
              <TableCell>{doc.specialties ?? "-"}</TableCell>
              <TableCell>{doc.languages ?? "-"}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mr-2"
                  onClick={() => setEditDoctor(doc)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteId(doc.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editDoctor && (
        <EditDoctorDialog
          open={!!editDoctor}
          onOpenChange={(o) => !o && setEditDoctor(null)}
          doctor={editDoctor}
        />
      )}

      {deleteId && (
        <DeleteDoctorDialog
          open={!!deleteId}
          onOpenChange={(o) => !o && setDeleteId(null)}
          doctorId={deleteId}
        />
      )}
    </>
  );
}

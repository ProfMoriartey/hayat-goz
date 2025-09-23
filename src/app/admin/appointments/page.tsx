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
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { EditAppointmentDialog } from "./edit-dialog";
import { CancelAppointmentDialog } from "./cancel-dialog";

const ApiResponseSchema = z.object({
  appointments: z.array(
    z.object({
      id: z.string().uuid(),
      startTime: z.string(),
      endTime: z.string(),
      status: z.string(),
      doctorName: z.string().nullable(),
      patientName: z.string().nullable(),
      patientPhone: z.string().nullable(),
      typeName: z.string().nullable(),
    }),
  ),
});

type Appointment = z.infer<typeof ApiResponseSchema>["appointments"][number];

export default function AdminAppointmentsPage() {
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Appointment | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  async function loadData() {
    try {
      const res = await fetch("/api/appointments");
      const json = (await res.json()) as unknown;
      const parsed = ApiResponseSchema.parse(json);
      setData(parsed.appointments);
    } catch (e) {
      console.error("Failed to load appointments", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No appointments found.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead> {/* 👈 add column */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((a) => {
                const start = new Date(a.startTime);
                const end = new Date(a.endTime);
                return (
                  <TableRow key={a.id}>
                    <TableCell>{a.doctorName ?? "-"}</TableCell>
                    <TableCell>{a.patientName ?? "-"}</TableCell>
                    <TableCell>{a.patientPhone ?? "-"}</TableCell>
                    <TableCell>{a.typeName ?? "-"}</TableCell>
                    <TableCell>
                      {start.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {start.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {end.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          a.status === "CONFIRMED"
                            ? "default"
                            : a.status === "CANCELLED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEdit(a)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setCancelId(a.id)}
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* 👇 dialogs */}
      {edit && (
        <EditAppointmentDialog
          open={!!edit}
          onOpenChange={(o) => !o && setEdit(null)}
          appointment={edit}
          refresh={loadData}
        />
      )}

      {cancelId && (
        <CancelAppointmentDialog
          open={!!cancelId}
          onOpenChange={(o) => !o && setCancelId(null)}
          appointmentId={cancelId}
          refresh={loadData}
        />
      )}
    </Card>
  );
}

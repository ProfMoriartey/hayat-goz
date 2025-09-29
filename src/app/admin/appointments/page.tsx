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
import { Input } from "~/components/ui/input";
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

type SortKey =
  | "doctorName"
  | "patientName"
  | "patientPhone"
  | "typeName"
  | "startTime"
  | "endTime"
  | "status";

type SortDir = "asc" | "desc";
type SortRule = { key: SortKey; dir: SortDir };

const PAGE_SIZE = 25;

export default function AdminAppointmentsPage() {
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Appointment | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  // 🔍 filters
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterPatient, setFilterPatient] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // ↕️ sorting
  const [sortRule, setSortRule] = useState<SortRule | null>({
    key: "startTime",
    dir: "desc", // default: latest first
  });

  // 📄 pagination
  const [page, setPage] = useState(0);

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

  function handleSort(key: SortKey) {
    setSortRule((prev) => {
      if (prev?.key === key) {
        if (prev.dir === "asc") return { key, dir: "desc" };
        if (prev.dir === "desc") return null;
      }
      return { key, dir: "asc" };
    });
    setPage(0); // reset to first page when sorting changes
  }

  function sortIndicator(key: SortKey) {
    if (sortRule?.key !== key) return null;
    return sortRule.dir === "asc" ? "↑" : "↓";
  }

  // apply filters
  const filteredData = data.filter((a) => {
    const start = new Date(a.startTime);
    // const end = new Date(a.endTime);

    const startDateStr = start.toISOString().slice(0, 10); // yyyy-mm-dd
    const startTimeStr = start.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      (!filterDoctor ||
        a.doctorName?.toLowerCase().includes(filterDoctor.toLowerCase())) &&
      (!filterPatient ||
        a.patientName?.toLowerCase().includes(filterPatient.toLowerCase())) &&
      (!filterPhone ||
        a.patientPhone?.toLowerCase().includes(filterPhone.toLowerCase())) &&
      (!filterType ||
        a.typeName?.toLowerCase().includes(filterType.toLowerCase())) &&
      (!filterDate || startDateStr === filterDate) &&
      (!filterTime || startTimeStr.startsWith(filterTime)) &&
      (!filterStatus ||
        a.status.toLowerCase().includes(filterStatus.toLowerCase()))
    );
  });

  // apply sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortRule) return 0;
    const { key, dir } = sortRule;

    let x: string | number = "";
    let y: string | number = "";

    if (key === "startTime" || key === "endTime") {
      x = new Date(a[key]).getTime();
      y = new Date(b[key]).getTime();
    } else {
      x = a[key] ?? "";
      y = b[key] ?? "";
    }

    let cmp: number;
    if (typeof x === "number" && typeof y === "number") {
      cmp = x - y;
    } else {
      cmp = String(x).localeCompare(String(y));
    }

    return dir === "asc" ? cmp : -cmp;
  });

  // paginate
  const totalPages = Math.ceil(sortedData.length / PAGE_SIZE);
  const pageData = sortedData.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments</CardTitle>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-4">
          <Input
            placeholder="Filter by doctor"
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
          />
          <Input
            placeholder="Filter by patient"
            value={filterPatient}
            onChange={(e) => setFilterPatient(e.target.value)}
          />
          <Input
            placeholder="Filter by phone"
            value={filterPhone}
            onChange={(e) => setFilterPhone(e.target.value)}
          />
          <Input
            placeholder="Filter by type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          />
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <Input
            type="time"
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
          />
          <Input
            placeholder="Filter by status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : pageData.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No appointments found.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    onClick={() => handleSort("doctorName")}
                    className="cursor-pointer"
                  >
                    Doctor {sortIndicator("doctorName")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("patientName")}
                    className="cursor-pointer"
                  >
                    Patient {sortIndicator("patientName")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("patientPhone")}
                    className="cursor-pointer"
                  >
                    Phone {sortIndicator("patientPhone")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("typeName")}
                    className="cursor-pointer"
                  >
                    Type {sortIndicator("typeName")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("startTime")}
                    className="cursor-pointer"
                  >
                    Date {sortIndicator("startTime")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("endTime")}
                    className="cursor-pointer"
                  >
                    Time {sortIndicator("endTime")}
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("status")}
                    className="cursor-pointer"
                  >
                    Status {sortIndicator("status")}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map((a) => {
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

            {/* pagination controls */}
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {page + 1} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </CardContent>

      {/* dialogs */}
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

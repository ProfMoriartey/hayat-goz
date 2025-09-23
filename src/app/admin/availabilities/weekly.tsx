"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { EditWeeklyDialog } from "./weekly-dialog";
import { AddAvailabilityDialog } from "./weekly-add-dialog";

const ApiResponseSchema = z.object({
  availabilities: z.array(
    z.object({
      id: z.string().uuid(),
      doctorId: z.string().uuid(),
      dayOfWeek: z.number(),
      startTime: z.string(),
      endTime: z.string(),
      slotSizeMin: z.number(),
    }),
  ),
});

type Availability = z.infer<typeof ApiResponseSchema>["availabilities"][number];

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function WeeklyAvailability({ doctorId }: { doctorId: string }) {
  const [data, setData] = useState<Availability[]>([]);
  const [edit, setEdit] = useState<Availability | null>(null);
  const [addDay, setAddDay] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/availabilities");
      const json = (await res.json()) as unknown;
      const parsed = ApiResponseSchema.parse(json);
      setData(parsed.availabilities.filter((a) => a.doctorId === doctorId));
    })();
  }, [doctorId]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {DAYS.map((day, idx) => {
        const rows = data.filter((a) => a.dayOfWeek === idx);
        return (
          <Card key={day}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{day}</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddDay(idx)}
              >
                + Add
              </Button>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No availability set
                </p>
              ) : (
                rows.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between border-b py-1"
                  >
                    <span>
                      {a.startTime} – {a.endTime} ({a.slotSizeMin} min slots)
                    </span>
                    <Button size="sm" onClick={() => setEdit(a)}>
                      Edit
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}

      {edit && (
        <EditWeeklyDialog
          open={!!edit}
          onOpenChange={(o) => !o && setEdit(null)}
          availability={edit}
        />
      )}

      {addDay !== null && (
        <AddAvailabilityDialog
          open={addDay !== null}
          onOpenChange={(o) => !o && setAddDay(null)}
          doctorId={doctorId}
          dayOfWeek={addDay}
        />
      )}
    </div>
  );
}

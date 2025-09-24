"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { AddDailyDialog } from "./daily-add-dialog";
import { EditDailyDialog } from "./daily-edit-dialog";

const ApiResponseSchema = z.object({
  availabilities: z.array(
    z.object({
      id: z.string().uuid(),
      doctorId: z.string().uuid(),
      date: z.string(), // <-- YYYY-MM-DD
      startTime: z.string(),
      endTime: z.string(),
      slotSizeMin: z.number(),
    }),
  ),
});

type Availability = z.infer<typeof ApiResponseSchema>["availabilities"][number];

export default function WeeklyAvailability({ doctorId }: { doctorId: string }) {
  const [data, setData] = useState<Availability[]>([]);
  const [edit, setEdit] = useState<Availability | null>(null);
  const [addDate, setAddDate] = useState<string | null>(null);

  // figure out the current week (Mon–Sun)
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    void (async () => {
      const url = new URL("/api/daily-availabilities", window.location.origin);
      url.searchParams.set("doctorId", doctorId);
      url.searchParams.set("start", format(weekStart, "yyyy-MM-dd"));
      url.searchParams.set("end", format(weekEnd, "yyyy-MM-dd"));

      const res = await fetch(url.toString());
      const json = (await res.json()) as unknown;
      const parsed = ApiResponseSchema.parse(json);
      setData(parsed.availabilities);
    })();
  }, [doctorId]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {days.map((day) => {
        const iso = format(day, "yyyy-MM-dd");
        const rows = data.filter(
          (a) => a.date.startsWith(iso) && a.doctorId === doctorId,
        );
        return (
          <Card key={iso}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{format(day, "EEEE d MMM")}</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddDate(iso)}
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

      {/* Dialogs */}
      {edit && (
        <EditDailyDialog
          open={!!edit}
          onOpenChange={(o) => !o && setEdit(null)}
          availability={edit}
          doctorId={""}
        />
      )}

      {addDate && (
        <AddDailyDialog
          open={!!addDate}
          onOpenChange={(o) => !o && setAddDate(null)}
          doctorId={doctorId}
          date={addDate}
        />
      )}
    </div>
  );
}

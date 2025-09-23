"use client";

import { useEffect, useState } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { z } from "zod";
import { AddDailyDialog } from "./daily-add-dialog";
import { EditDailyDialog } from "./daily-edit-dialog";

const ApiResponseSchema = z.object({
  availabilities: z.array(
    z.object({
      id: z.string().uuid(),
      doctorId: z.string().uuid(),
      date: z.string(), // YYYY-MM-DD
      startTime: z.string(),
      endTime: z.string(),
      slotSizeMin: z.number(),
    }),
  ),
});

type DailyAvailability = z.infer<
  typeof ApiResponseSchema
>["availabilities"][number];

export default function CalendarAvailability({
  doctorId,
}: {
  doctorId: string;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [data, setData] = useState<DailyAvailability[]>([]);
  const [addDate, setAddDate] = useState<string | null>(null);
  const [edit, setEdit] = useState<DailyAvailability | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/daily-availabilities");
      const json = (await res.json()) as unknown;
      const parsed = ApiResponseSchema.parse(json);
      setData(parsed.availabilities.filter((a) => a.doctorId === doctorId));
    })();
  }, [doctorId, currentMonth]);

  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          ← Prev
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button
          variant="outline"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          Next →
        </Button>
      </div>
      <div className="space-y-4">
        {/* Calendar Grid */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {days.map((day) => {
            const iso = format(day, "yyyy-MM-dd");
            const availabilities = data.filter((a) => a.date.startsWith(iso));

            return (
              <Card key={iso} className="flex flex-col p-2">
                {/* Header inside cell */}
                <CardHeader className="flex flex-row items-center justify-between p-1">
                  <CardTitle className="text-sm font-medium">
                    {format(day, "EEE d MMM")}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => setAddDate(iso)}
                  >
                    + Add
                  </Button>
                </CardHeader>

                {/* Availabilities list */}
                <CardContent className="flex-1 space-y-2 p-1">
                  {availabilities.length > 0 ? (
                    availabilities.map((a) => (
                      <div
                        key={a.id}
                        className="flex flex-col space-y-1 rounded border p-1 text-xs"
                      >
                        <p className="truncate">
                          {a.startTime} – {a.endTime} ({a.slotSizeMin}m)
                        </p>
                        <Button
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => setEdit(a)}
                        >
                          Edit
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-xs italic">
                      No slots
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {addDate && (
        <AddDailyDialog
          open={!!addDate}
          onOpenChange={(o) => !o && setAddDate(null)}
          doctorId={doctorId}
          date={addDate}
        />
      )}

      {edit && (
        <EditDailyDialog
          open={!!edit}
          onOpenChange={(o) => !o && setEdit(null)}
          availability={edit}
          doctorId={doctorId}
        />
      )}
    </div>
  );
}

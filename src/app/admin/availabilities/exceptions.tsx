"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { EditExceptionDialog } from "./exception-dialog";

const ApiResponseSchema = z.object({
  exceptions: z.array(
    z.object({
      id: z.string().uuid(),
      doctorId: z.string().uuid(),
      date: z.string(),
      isClosed: z.boolean(),
      windows: z.string().nullable(),
    }),
  ),
});

type Exception = z.infer<typeof ApiResponseSchema>["exceptions"][number];

export default function AvailabilityExceptions({
  doctorId,
}: {
  doctorId: string;
}) {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [edit, setEdit] = useState<Exception | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/availability-exceptions");
      const json = (await res.json()) as unknown;
      const parsed = ApiResponseSchema.parse(json);
      setExceptions(parsed.exceptions.filter((e) => e.doctorId === doctorId));
    })();
  }, [doctorId]);

  const dayStr = selected ? selected.toISOString().split("T")[0] : undefined;
  const existing = dayStr
    ? exceptions.find((e) => e.date.startsWith(dayStr))
    : undefined;

  async function toggleClosed() {
    if (!dayStr) return;
    await fetch("/api/availability-exceptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId,
        date: dayStr,
        isClosed: !existing?.isClosed,
      }),
    });
    window.location.reload();
  }

  return (
    <div className="flex gap-6">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={setSelected}
        className="rounded-md border"
      />
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Exceptions for {dayStr}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {existing ? (
            <>
              <p>
                {existing.isClosed
                  ? "Closed all day"
                  : `Windows: ${existing.windows ?? "Full day"}`}
              </p>
              <div className="flex gap-2">
                <Button onClick={toggleClosed}>
                  {existing.isClosed ? "Reopen" : "Mark Closed"}
                </Button>
                <Button variant="secondary" onClick={() => setEdit(existing)}>
                  Set Windows
                </Button>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">
              No override set for this date
            </p>
          )}
        </CardContent>
      </Card>

      {edit && (
        <EditExceptionDialog
          open={!!edit}
          onOpenChange={(o) => !o && setEdit(null)}
          exception={edit}
          doctorId={doctorId}
        />
      )}
    </div>
  );
}

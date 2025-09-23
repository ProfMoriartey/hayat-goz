"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

// Zod schema for API response validation
const SlotSchema = z.object({
  startUtc: z.string(),
  endUtc: z.string(),
});
const ApiResponseSchema = z.object({
  slots: z.array(SlotSchema),
});

export default function BookPage() {
  const [doctorId, setDoctorId] = useState("");
  const [appointmentTypeId, setAppointmentTypeId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<{ startUtc: string; endUtc: string }[]>(
    [],
  );

  useEffect(() => {
    if (!doctorId || !appointmentTypeId || !date) return;

    void (async () => {
      try {
        const url = new URL("/api/availability", window.location.origin);
        url.searchParams.set("doctorId", doctorId);
        url.searchParams.set("appointmentTypeId", appointmentTypeId);
        url.searchParams.set("date", date);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to load slots");

        const json = (await res.json()) as unknown;
        const data = ApiResponseSchema.parse(json); // ✅ runtime validation
        setSlots(data.slots);
      } catch (err) {
        console.error("Error loading slots:", err);
      }
    })();
  }, [doctorId, appointmentTypeId, date]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Book an appointment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Input
              placeholder="Doctor ID"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            />
            <Input
              placeholder="Appointment Type ID"
              value={appointmentTypeId}
              onChange={(e) => setAppointmentTypeId(e.target.value)}
            />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {slots.map((s) => (
              <Button
                key={s.startUtc}
                variant="outline"
                onClick={() =>
                  navigator.clipboard.writeText(s.startUtc).catch(console.error)
                }
              >
                {new Date(s.startUtc).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Button>
            ))}
          </div>

          <p className="text-muted-foreground text-sm">
            (Temporary UI) Click a slot to copy its UTC start time. Next step
            we’ll post to <code>/api/appointments</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

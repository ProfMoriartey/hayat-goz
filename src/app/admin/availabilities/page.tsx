"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import WeeklyAvailability from "./weekly";
import AvailabilityExceptions from "./exceptions";

const ApiResponseSchema = z.object({
  doctors: z.array(
    z.object({
      id: z.string().uuid(),
      displayName: z.string(),
    }),
  ),
});

export default function AvailabilitiesPage() {
  const [doctorId, setDoctorId] = useState<string>("");
  const [doctors, setDoctors] = useState<{ id: string; displayName: string }[]>(
    [],
  );

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/doctors");
      const json = (await res.json()) as unknown;
      const parsed = ApiResponseSchema.parse(json);
      setDoctors(parsed.doctors);
      if (parsed.doctors.length > 0) {
        setDoctorId(parsed.doctors.at(0)!.id);
      }
    })();
  }, []);

  if (!doctorId) {
    return (
      <p className="text-muted-foreground p-6">
        No doctors found. Please add one first.
      </p>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Doctor Availabilities</h1>

      <div className="w-64">
        <Select value={doctorId} onValueChange={setDoctorId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a doctor" />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Weekly Template</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly">
          <WeeklyAvailability doctorId={doctorId} />
        </TabsContent>
        <TabsContent value="exceptions">
          <AvailabilityExceptions doctorId={doctorId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

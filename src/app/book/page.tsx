"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";

import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { PatientInfoForm } from "./PatientInfoForm";

// ---------- Types & schemas ----------
const DoctorsResponseSchema = z.object({
  doctors: z.array(
    z.object({
      id: z.string().uuid(),
      displayName: z.string(),
      specialties: z.string().nullable(),
      languages: z.string().nullable(),
    }),
  ),
});
type Doctor = z.infer<typeof DoctorsResponseSchema>["doctors"][number];

const AppointmentTypesResponseSchema = z.object({
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
type AppointmentType = z.infer<
  typeof AppointmentTypesResponseSchema
>["types"][number];

const SlotsResponseSchema = z.object({
  slots: z.array(
    z.object({
      startUtc: z.string(),
      endUtc: z.string(),
    }),
  ),
});
type Slot = z.infer<typeof SlotsResponseSchema>["slots"][number];

type WizardData = {
  doctorId: string | null;
  appointmentTypeId: string | null;
  date: string | null; // YYYY-MM-DD
  slot: { startUtc: string; endUtc: string } | null;
  patient: { fullName: string; phone: string; email?: string } | null;
};

// ---------- Component ----------
export default function BookPage() {
  // step: 0=doctor, 1=type, 2=date, 3=slot, 4=details, 5=review
  const [step, setStep] = useState<number>(0);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [data, setData] = useState<WizardData>({
    doctorId: null,
    appointmentTypeId: null,
    date: null,
    slot: null,
    patient: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch doctors
  useEffect(() => {
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch("/api/doctors");
        if (!res.ok) throw new Error("Failed to load doctors");
        const json = (await res.json()) as unknown;
        const parsed = DoctorsResponseSchema.parse(json);
        setDoctors(parsed.doctors);
        // preselect first doctor for convenience (if none chosen yet)
        if (!data.doctorId && parsed.doctors.length > 0) {
          setData((prev) => ({ ...prev, doctorId: parsed.doctors[0]!.id }));
        }
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Unexpected error loading doctors";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // load once

  const [types, setTypes] = useState<AppointmentType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [errorTypes, setErrorTypes] = useState<string | null>(null);

  // fetch appointment types when step=1
  useEffect(() => {
    if (step !== 1) return;
    setLoadingTypes(true);
    setErrorTypes(null);
    void (async () => {
      try {
        const res = await fetch("/api/appointment-types");
        if (!res.ok) throw new Error("Failed to load appointment types");
        const json = (await res.json()) as unknown;
        const parsed = AppointmentTypesResponseSchema.parse(json);
        setTypes(parsed.types);
        if (!data.appointmentTypeId && parsed.types.length > 0) {
          setData((prev) => ({
            ...prev,
            appointmentTypeId: parsed.types[0]!.id,
          }));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unexpected error";
        setErrorTypes(msg);
      } finally {
        setLoadingTypes(false);
      }
    })();
  }, [step]);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorSlots, setErrorSlots] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 3 || !data.doctorId || !data.appointmentTypeId || !data.date)
      return;

    setLoadingSlots(true);
    setErrorSlots(null);
    void (async () => {
      try {
        const url = new URL("/api/availability", window.location.origin);
        url.searchParams.set("doctorId", data.doctorId!);
        url.searchParams.set("appointmentTypeId", data.appointmentTypeId!);
        url.searchParams.set("date", data.date!);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to load slots");

        const json = (await res.json()) as unknown;
        const parsed = SlotsResponseSchema.parse(json);
        setSlots(parsed.slots);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unexpected error";
        setErrorSlots(msg);
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, [step, data.doctorId, data.appointmentTypeId, data.date]);

  const canContinue = useMemo(() => !!data.doctorId, [data.doctorId]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      {/* Simple step header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Book an appointment</h1>
        <span className="text-muted-foreground text-sm">
          Step {step + 1} of 6
        </span>
      </div>
      <Separator />

      {/* STEP 1: Doctor selection */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select a doctor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : doctors.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No doctors available yet. Please try again later.
              </p>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Doctor</label>
                  <Select
                    value={data.doctorId ?? undefined}
                    onValueChange={(val) =>
                      setData((prev) => ({ ...prev, doctorId: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.displayName}
                          {d.specialties ? ` — ${d.specialties}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Next button */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      // (no-op; first step)
                    }}
                    disabled
                  >
                    Back
                  </Button>
                  <Button onClick={() => setStep(1)} disabled={!canContinue}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Appointment Type */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select appointment type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingTypes ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : errorTypes ? (
              <p className="text-sm text-red-600">{errorTypes}</p>
            ) : types.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No appointment types available.
              </p>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={data.appointmentTypeId ?? undefined}
                    onValueChange={(val) =>
                      setData((prev) => ({ ...prev, appointmentTypeId: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose appointment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.durationMin} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Navigation */}
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setStep(0)}>
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!data.appointmentTypeId}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Date selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select a date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !data.date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.date
                      ? new Date(data.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.date ? new Date(data.date) : undefined}
                    onSelect={(day) => {
                      if (day) {
                        const dateString = day.toISOString().split("T")[0]!; // Add ! to assert non-null
                        setData((prev) => ({
                          ...prev,
                          date: dateString,
                        }));
                      } else {
                        // Handle the case where day is undefined (user clears selection)
                        setData((prev) => ({
                          ...prev,
                          date: null,
                        }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Navigation */}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!data.date}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Time slot selection */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Select a time slot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingSlots ? (
              <p className="text-muted-foreground text-sm">Loading slots…</p>
            ) : errorSlots ? (
              <p className="text-sm text-red-600">{errorSlots}</p>
            ) : slots.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No available slots for this date.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {slots.map((s) => {
                  const start = new Date(s.startUtc);
                  const label = start.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const isSelected = data.slot?.startUtc === s.startUtc;

                  return (
                    <Button
                      key={s.startUtc}
                      variant={isSelected ? "default" : "outline"}
                      className="text-sm"
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          slot: s,
                        }))
                      }
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={!data.slot}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Enter your details</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientInfoForm
              initial={data.patient}
              onComplete={(patient) => {
                setData((prev) => ({ ...prev, patient }));
                setStep(5);
              }}
            />
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setStep(3)}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && data.patient && data.slot && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Confirm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Doctor:</strong>{" "}
                {doctors.find((d) => d.id === data.doctorId)?.displayName}
              </p>
              <p>
                <strong>Appointment Type:</strong>{" "}
                {types.find((t) => t.id === data.appointmentTypeId)?.name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {data.date &&
                  new Date(data.date).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {new Date(data.slot.startUtc).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p>
                <strong>Patient:</strong> {data.patient.fullName},{" "}
                {data.patient.phone}
                {data.patient.email ? `, ${data.patient.email}` : ""}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                disabled={!data.slot} // guard button
                onClick={async () => {
                  if (!data.slot || !data.patient) return; // ⬅️ runtime guard

                  try {
                    const res = await fetch("/api/appointments", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        doctorId: data.doctorId,
                        appointmentTypeId: data.appointmentTypeId,
                        startUtc: data.slot.startUtc, // ✅ safe now
                        patient: data.patient,
                      }),
                    });

                    if (!res.ok) throw new Error("Booking failed");
                    alert("Appointment booked successfully!");
                    // TODO: redirect to confirmation page or home
                  } catch (e) {
                    const msg =
                      e instanceof Error
                        ? e.message
                        : "Unexpected booking error";
                    alert(msg);
                  }
                }}
              >
                Confirm
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

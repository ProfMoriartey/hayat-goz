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
import {
  startOfWeek,
  endOfWeek,
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  addMonths,
} from "date-fns";

import { useRouter } from "next/navigation";

import { PatientInfoForm } from "./PatientInfoForm";

import { useTranslations } from "next-intl";

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
      isBooked: z.boolean(), // ✅ include booked flag
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

  const router = useRouter();

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

  const [weekly, setWeekly] = useState<
    { date: string; totalSlots: number; freeSlots: number; hasSlots: boolean }[]
  >([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  useEffect(() => {
    if (step !== 2 || !data.doctorId || !data.appointmentTypeId) return;

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    void (async () => {
      try {
        setLoadingWeekly(true);
        const url = new URL("/api/availability", window.location.origin);
        url.searchParams.set("doctorId", data.doctorId!);
        url.searchParams.set("weekStart", format(weekStart, "yyyy-MM-dd"));
        url.searchParams.set("weekEnd", format(weekEnd, "yyyy-MM-dd"));

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to load weekly availability");
        const json = (await res.json()) as { availability: typeof weekly };
        setWeekly(json.availability);
      } catch (err) {
        console.error("Weekly fetch error", err);
      } finally {
        setLoadingWeekly(false);
      }
    })();
  }, [step, data.doctorId, data.appointmentTypeId]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthAvailability, setMonthAvailability] = useState<
    { date: string; totalSlots: number; freeSlots: number; hasSlots: boolean }[]
  >([]);
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Load month availability whenever doctorId or currentMonth changes
  useEffect(() => {
    if (!data.doctorId) return;

    const monthStr = format(currentMonth, "yyyy-MM"); // YYYY-MM

    setLoadingMonth(true);
    void (async () => {
      try {
        const url = new URL("/api/availability", window.location.origin);
        url.searchParams.set("doctorId", data.doctorId!);
        url.searchParams.set("month", monthStr);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to load monthly availability");

        const json = (await res.json()) as {
          availability: {
            date: string;
            totalSlots: number;
            freeSlots: number;
            hasSlots: boolean;
          }[];
        };
        setMonthAvailability(json.availability);
      } catch (err) {
        console.error("Error fetching monthly availability", err);
      } finally {
        setLoadingMonth(false);
      }
    })();
  }, [data.doctorId, currentMonth]);

  // Build days of current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const canContinue = useMemo(() => !!data.doctorId, [data.doctorId]);

  const t = useTranslations("BookPage");

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
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Select a date</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >
                Prev
              </Button>
              <span className="font-medium">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                Next
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingMonth ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : (
              <>
                {/* Weekday labels */}
                <div className="text-muted-foreground mb-2 grid grid-cols-7 gap-2 text-center text-sm font-medium">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d) => (
                      <div key={d}>{d}</div>
                    ),
                  )}
                </div>

                {/* Dates grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {(() => {
                    const firstDay = startOfMonth(currentMonth);
                    const lastDay = endOfMonth(currentMonth);

                    const startDayOfWeek = firstDay.getDay();
                    const days = eachDayOfInterval({
                      start: firstDay,
                      end: lastDay,
                    });
                    const fillers: (Date | null)[] = Array.from(
                      { length: startDayOfWeek },
                      () => null,
                    );
                    const paddedDays: (Date | null)[] = [...fillers, ...days];

                    return paddedDays.map((day, idx) => {
                      if (!day) return <div key={`empty-${idx}`} />;

                      const dateStr = format(day, "yyyy-MM-dd");
                      const availability = monthAvailability.find(
                        (d) => d.date === dateStr,
                      );
                      const isSelected = data.date === dateStr;
                      const isAvailable = availability?.hasSlots ?? false;

                      return (
                        <Button
                          key={dateStr}
                          size="sm"
                          variant={
                            !isAvailable
                              ? "secondary"
                              : isSelected
                                ? "default"
                                : "outline"
                          }
                          disabled={!isAvailable}
                          onClick={() =>
                            setData((prev) => ({
                              ...prev,
                              date: dateStr,
                            }))
                          }
                          className="mx-auto h-10 w-10 p-0 sm:h-16 sm:w-16"
                        >
                          {format(day, "d")}
                        </Button>
                      );
                    });
                  })()}
                </div>
              </>
            )}

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
                      className={`text-sm ${
                        s.isBooked ? "cursor-not-allowed opacity-50" : ""
                      }`}
                      disabled={s.isBooked}
                      onClick={() =>
                        !s.isBooked &&
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
                    if (!res.ok) {
                      if (res.status === 409) {
                        alert("Sorry, this slot is no longer available.");
                      } else {
                        throw new Error("Booking failed");
                      }
                      return;
                    }
                    if (!res.ok) throw new Error("Booking failed");
                    alert("Appointment booked successfully!");
                    router.push("/");
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

// return (
//   <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
//     {/* Simple step header */}
//     <div className="flex items-center justify-between">
//       <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
//       <span className="text-muted-foreground text-sm">
//         {t("header.step", { current: step + 1, total: 6 })}
//       </span>
//     </div>
//     <Separator />

//     {/* STEP 1: Doctor selection */}
//     {step === 0 && (
//       <Card>
//         <CardHeader>
//           <CardTitle>{t("doctor.title")}</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {loading ? (
//             <p className="text-muted-foreground text-sm">{t("doctor.loading")}</p>
//           ) : error ? (
//             <p className="text-sm text-red-600">{t("doctor.error")}</p>
//           ) : doctors.length === 0 ? (
//             <p className="text-muted-foreground text-sm">{t("doctor.none")}</p>
//           ) : (
//             <div className="grid gap-4">
//               <div className="grid gap-2">
//                 <label className="text-sm font-medium">{t("doctor.label")}</label>
//                 <Select
//                   value={data.doctorId ?? undefined}
//                   onValueChange={(val) => setData((prev) => ({ ...prev, doctorId: val }))}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder={t("doctor.placeholder")} />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {doctors.map((d) => (
//                       <SelectItem key={d.id} value={d.id}>
//                         {d.displayName}
//                         {d.specialties ? ` — ${d.specialties}` : ""}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="flex justify-end gap-2">
//                 <Button variant="secondary" disabled>
//                   {t("buttons.back")}
//                 </Button>
//                 <Button onClick={() => setStep(1)} disabled={!canContinue}>
//                   {t("buttons.next")}
//                 </Button>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     )}

//     {/* STEP 2: Appointment Type */}
//     {step === 1 && (
//       <Card>
//         <CardHeader>
//           <CardTitle>{t("type.title")}</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {loadingTypes ? (
//             <p className="text-muted-foreground text-sm">{t("type.loading")}</p>
//           ) : errorTypes ? (
//             <p className="text-sm text-red-600">{t("type.error")}</p>
//           ) : types.length === 0 ? (
//             <p className="text-muted-foreground text-sm">{t("type.none")}</p>
//           ) : (
//             <div className="grid gap-4">
//               <div className="grid gap-2">
//                 <label className="text-sm font-medium">{t("type.label")}</label>
//                 <Select
//                   value={data.appointmentTypeId ?? undefined}
//                   onValueChange={(val) =>
//                     setData((prev) => ({ ...prev, appointmentTypeId: val }))
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder={t("type.placeholder")} />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {types.map((tType) => (
//                       <SelectItem key={tType.id} value={tType.id}>
//                         {tType.name} ({tType.durationMin} min)
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="flex justify-end gap-2">
//                 <Button variant="secondary" onClick={() => setStep(0)}>
//                   {t("buttons.back")}
//                 </Button>
//                 <Button
//                   onClick={() => setStep(2)}
//                   disabled={!data.appointmentTypeId}
//                 >
//                   {t("buttons.next")}
//                 </Button>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     )}

//     {/* STEP 3: Date selection */}
//     {step === 2 && (
//       <Card>
//         <CardHeader className="flex items-center justify-between">
//           <CardTitle>{t("date.title")}</CardTitle>
//           <div className="flex items-center gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
//             >
//               Prev
//             </Button>
//             <span className="font-medium">{format(currentMonth, "MMMM yyyy")}</span>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
//             >
//               Next
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {loadingMonth ? (
//             <p className="text-muted-foreground text-sm">{t("date.loading")}</p>
//           ) : (
//             <>
//               <div className="text-muted-foreground mb-2 grid grid-cols-7 gap-2 text-center text-sm font-medium">
//                 {t.raw("date.weekdays").map((d: string) => (
//                   <div key={d}>{d}</div>
//                 ))}
//               </div>
//               {/* Calendar grid stays the same */}
//             </>
//           )}

//           <div className="flex justify-end gap-2">
//             <Button variant="secondary" onClick={() => setStep(1)}>
//               {t("buttons.back")}
//             </Button>
//             <Button onClick={() => setStep(3)} disabled={!data.date}>
//               {t("buttons.next")}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     )}

//     {/* STEP 4: Time slot */}
//     {step === 3 && (
//       <Card>
//         <CardHeader>
//           <CardTitle>{t("slot.title")}</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {loadingSlots ? (
//             <p className="text-muted-foreground text-sm">{t("slot.loading")}</p>
//           ) : errorSlots ? (
//             <p className="text-sm text-red-600">{t("slot.error")}</p>
//           ) : slots.length === 0 ? (
//             <p className="text-muted-foreground text-sm">{t("slot.none")}</p>
//           ) : (
//             <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
//               {/* slot buttons remain unchanged */}
//             </div>
//           )}

//           <div className="flex justify-end gap-2">
//             <Button variant="secondary" onClick={() => setStep(2)}>
//               {t("buttons.back")}
//             </Button>
//             <Button onClick={() => setStep(4)} disabled={!data.slot}>
//               {t("buttons.next")}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     )}

//     {/* STEP 5: Patient details */}
//     {step === 4 && (
//       <Card>
//         <CardHeader>
//           <CardTitle>{t("details.title")}</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <PatientInfoForm
//             initial={data.patient}
//             onComplete={(patient) => {
//               setData((prev) => ({ ...prev, patient }));
//               setStep(5);
//             }}
//           />
//           <div className="mt-4 flex justify-end">
//             <Button variant="secondary" onClick={() => setStep(3)}>
//               {t("buttons.back")}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     )}

//     {/* STEP 6: Review & Confirm */}
//     {step === 5 && data.patient && data.slot && (
//       <Card>
//         <CardHeader>
//           <CardTitle>{t("review.title")}</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="space-y-2 text-sm">
//             <p>
//               <strong>{t("review.doctor")}:</strong>{" "}
//               {doctors.find((d) => d.id === data.doctorId)?.displayName}
//             </p>
//             <p>
//               <strong>{t("review.type")}:</strong>{" "}
//               {types.find((tType) => tType.id === data.appointmentTypeId)?.name}
//             </p>
//             <p>
//               <strong>{t("review.date")}:</strong>{" "}
//               {data.date &&
//                 new Date(data.date).toLocaleDateString(undefined, {
//                   weekday: "long",
//                   year: "numeric",
//                   month: "long",
//                   day: "numeric"
//                 })}
//             </p>
//             <p>
//               <strong>{t("review.time")}:</strong>{" "}
//               {new Date(data.slot.startUtc).toLocaleTimeString([], {
//                 hour: "2-digit",
//                 minute: "2-digit"
//               })}
//             </p>
//             <p>
//               <strong>{t("review.patient")}:</strong> {data.patient.fullName},{" "}
//               {data.patient.phone}
//               {data.patient.email ? `, ${data.patient.email}` : ""}
//             </p>
//           </div>

//           <div className="flex justify-end gap-2">
//             <Button variant="secondary" onClick={() => setStep(2)}>
//               {t("buttons.back")}
//             </Button>
//             <Button
//               disabled={!data.slot}
//               onClick={async () => {
//                 if (!data.slot || !data.patient) return;
//                 try {
//                   const res = await fetch("/api/appointments", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({
//                       doctorId: data.doctorId,
//                       appointmentTypeId: data.appointmentTypeId,
//                       startUtc: data.slot.startUtc,
//                       patient: data.patient
//                     })
//                   });
//                   if (!res.ok) {
//                     if (res.status === 409) {
//                       alert(t("alerts.slotTaken"));
//                     } else {
//                       throw new Error(t("alerts.failed"));
//                     }
//                     return;
//                   }
//                   alert(t("alerts.success"));
//                   router.push("/");
//                 } catch {
//                   alert(t("alerts.unexpected"));
//                 }
//               }}
//             >
//               {t("buttons.confirm")}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     )}
//   </div>
// );

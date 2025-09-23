"use client";

import { useEffect, useState } from "react";

export default function BookPage() {
  const [doctorId, setDoctorId] = useState("");
  const [appointmentTypeId, setAppointmentTypeId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<{ startUtc: string; endUtc: string }[]>(
    [],
  );

  useEffect(() => {
    if (!doctorId || !appointmentTypeId || !date) return;
    const url = new URL("/api/availability", window.location.origin);
    url.searchParams.set("doctorId", doctorId);
    url.searchParams.set("appointmentTypeId", appointmentTypeId);
    url.searchParams.set("date", date);
    fetch(url.toString())
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []));
  }, [doctorId, appointmentTypeId, date]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Book an appointment</h1>
      <div className="grid gap-3">
        <input
          className="input input-bordered rounded border p-2"
          placeholder="Doctor ID"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
        />
        <input
          className="input input-bordered rounded border p-2"
          placeholder="Appointment Type ID"
          value={appointmentTypeId}
          onChange={(e) => setAppointmentTypeId(e.target.value)}
        />
        <input
          className="input input-bordered rounded border p-2"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((s) => (
          <button
            key={s.startUtc}
            className="rounded border p-2 hover:bg-gray-50"
            onClick={() => navigator.clipboard.writeText(s.startUtc)}
          >
            {new Date(s.startUtc).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500">
        (Temporary UI) Click a slot to copy its UTC start time. Next step we’ll
        post to /api/appointments.
      </p>
    </div>
  );
}

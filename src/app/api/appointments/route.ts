import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import {
  appointments,
  patients,
  appointmentTypes,
  doctors,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { addMinutes } from "date-fns";

// ---------- Schemas ----------
const PatientSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(5),
  email: z
    .string()
    .email()
    .optional()
    .or(z.literal("")) // allow empty string
    .transform((val) => (val === "" ? null : val)),
});

const BodySchema = z.object({
  doctorId: z.string().uuid(),
  appointmentTypeId: z.string().uuid(),
  startUtc: z
    .string()
    .refine((s) => !isNaN(Date.parse(s)), "Invalid ISO date"),
  patient: PatientSchema,
});

// ---------- GET (Admin) ----------
export async function GET() {
  const rows = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      status: appointments.status,
      doctorName: doctors.displayName,
      patientName: patients.fullName,
      patientPhone: patients.phone,
      typeName: appointmentTypes.name,
    })
    .from(appointments)
    .leftJoin(doctors, eq(doctors.id, appointments.doctorId))
    .leftJoin(patients, eq(patients.id, appointments.patientId))
    .leftJoin(
      appointmentTypes,
      eq(appointmentTypes.id, appointments.appointmentTypeId)
    );

  return NextResponse.json({ appointments: rows });
}

// ---------- POST (Booking) ----------
export async function POST(req: NextRequest) {
  const json = (await req.json()) as unknown;
  const parsed = BodySchema.parse(json);

  // 1. Find or create patient
  const existing = await db
    .select()
    .from(patients)
    .where(eq(patients.phone, parsed.patient.phone))
    .limit(1);

  let patientId: string;
  if (existing.length > 0) {
    patientId = existing[0]!.id;
  } else {
    const inserted = await db
      .insert(patients)
      .values({
        fullName: parsed.patient.fullName,
        phone: parsed.patient.phone,
        email: parsed.patient.email ?? null,
      })
      .returning();
    if (inserted.length === 0) {
      return NextResponse.json(
        { error: "Failed to create patient" },
        { status: 500 }
      );
    }
    patientId = inserted[0]!.id;
  }

  // 2. Get appointment type duration
  const apptType = await db
    .select()
    .from(appointmentTypes)
    .where(eq(appointmentTypes.id, parsed.appointmentTypeId))
    .limit(1);

  if (apptType.length === 0) {
    return NextResponse.json(
      { error: "Invalid appointment type" },
      { status: 400 }
    );
  }

  const durationMin = apptType[0]!.durationMin;
  const start = new Date(parsed.startUtc);
  const end = addMinutes(start, durationMin);

  // 3. Insert appointment
  const created = await db
    .insert(appointments)
    .values({
      doctorId: parsed.doctorId,
      appointmentTypeId: parsed.appointmentTypeId,
      patientId,
      startTime: start,
      endTime: end,
      status: "CONFIRMED",
    })
    .returning();

  if (created.length === 0) {
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }

  return NextResponse.json({ appointment: created[0] });
}

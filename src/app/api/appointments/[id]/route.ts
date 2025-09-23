import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { appointments, appointmentTypes } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { addMinutes } from "date-fns";

const ParamsSchema = z.object({ id: z.string().uuid() });

const UpdateSchema = z.object({
  doctorId: z.string().uuid().optional(),
  appointmentTypeId: z.string().uuid().optional(),
  startUtc: z
    .string()
    .optional()
    .refine((s) => !s || !isNaN(Date.parse(s)), "Invalid ISO date"),
  status: z.enum(["CONFIRMED", "CANCELLED", "NO_SHOW"]).optional(),
});

// -------- PATCH (Update appointment) --------
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = ParamsSchema.parse(await context.params);
  const json = (await req.json()) as unknown;
  const parsed = UpdateSchema.parse(json);

  // Load existing appointment
  const existing = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json(
      { error: "Appointment not found" },
      { status: 404 }
    );
  }

  const current = existing[0]!;

  // Figure out which type to use (new one if provided, otherwise current)
  const typeId = parsed.appointmentTypeId ?? current.appointmentTypeId;
  const apptType = await db
    .select()
    .from(appointmentTypes)
    .where(eq(appointmentTypes.id, typeId))
    .limit(1);

  if (apptType.length === 0) {
    return NextResponse.json(
      { error: "Invalid appointment type" },
      { status: 400 }
    );
  }

  // Recompute times
  let newStartTime = parsed.startUtc
    ? new Date(parsed.startUtc)
    : current.startTime;
  let newEndTime = addMinutes(newStartTime, apptType[0]!.durationMin);

  // Apply update
  const [updated] = await db
    .update(appointments)
    .set({
      doctorId: parsed.doctorId ?? current.doctorId,
      appointmentTypeId: parsed.appointmentTypeId ?? current.appointmentTypeId,
      startTime: newStartTime,
      endTime: newEndTime, // 👈 always update end time
      status: parsed.status ?? current.status,
    })
    .where(eq(appointments.id, id))
    .returning();

  return NextResponse.json({ appointment: updated });
}

// // -------- DELETE (Cancel appointment) --------
// export async function DELETE(
//   _req: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   const { id } = ParamsSchema.parse(await context.params);

//   const [deleted] = await db
//     .update(appointments)
//     .set({ status: "CANCELLED" }) // mark as cancelled instead of hard delete
//     .where(eq(appointments.id, id))
//     .returning();

//   if (!deleted) {
//     return NextResponse.json(
//       { error: "Appointment not found" },
//       { status: 404 }
//     );
//   }

//   return NextResponse.json({ success: true, appointment: deleted });
// }

// -------- HARD DELETE (remove appointment completely) --------
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = ParamsSchema.parse(await context.params);

  const [deleted] = await db
    .delete(appointments)
    .where(eq(appointments.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json(
      { error: "Appointment not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
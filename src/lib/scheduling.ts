import { db } from "~/server/db"
import { and, eq, gt, lt } from "drizzle-orm"
import {
  availabilities,
  availabilityExceptions,
  appointments,
  appointmentTypes,
} from "~/server/db/schema"
import { toZonedTime, fromZonedTime } from "date-fns-tz"
import { addMinutes, isBefore } from "date-fns"

export type Slot = { startUtc: string; endUtc: string }

function parseWindowStr(w: string): Array<{ start: string; end: string }> {
  return w
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const [start, end] = pair.split("-").map((x) => x.trim())
      if (!start || !end) {
        throw new Error(`Invalid window string: ${pair}`)
      }
      return { start, end }
    })
}

/**
 * Returns available UTC slots for a doctor on a given local (clinic) date.
 * @param doctorId UUID of doctor
 * @param localDate e.g. "2025-09-23" (Europe/Istanbul local)
 * @param appointmentTypeId UUID for duration/buffers
 */
export async function getAvailableSlots({
  doctorId,
  localDate,
  appointmentTypeId,
}: {
  doctorId: string
  localDate: string // YYYY-MM-DD in clinic timezone
  appointmentTypeId: string
}): Promise<Slot[]> {
  const CLINIC_TZ = "Europe/Istanbul"

  const apptType = (
    await db
      .select()
      .from(appointmentTypes)
      .where(eq(appointmentTypes.id, appointmentTypeId))
  )[0]
  if (!apptType) return []

  // Day boundaries in clinic TZ → convert to UTC
  const dayStartUtc = fromZonedTime(`${localDate}T00:00:00`, CLINIC_TZ)
  const dayEndUtc = fromZonedTime(`${localDate}T23:59:59`, CLINIC_TZ)

  // Weekly template
  const weekday = toZonedTime(dayStartUtc, CLINIC_TZ).getDay() // 0-6
  const weekly = await db
    .select()
    .from(availabilities)
    .where(
      and(
        eq(availabilities.doctorId, doctorId),
        eq(availabilities.dayOfWeek, weekday)
      )
    )

  // Exceptions
  const exception = (
    await db
      .select()
      .from(availabilityExceptions)
      .where(
        and(
          eq(availabilityExceptions.doctorId, doctorId),
          gt(availabilityExceptions.date, dayStartUtc),
          lt(availabilityExceptions.date, dayEndUtc)
        )
      )
  )[0]

  if (!weekly.length && !exception) return []
  if (exception?.isClosed) return []

  const windows: Array<{
    startLocal: string
    endLocal: string
    granularityMin: number
  }> = []

  if (exception?.windows) {
    for (const w of parseWindowStr(exception.windows)) {
      windows.push({
        startLocal: `${localDate}T${w.start}:00`,
        endLocal: `${localDate}T${w.end}:00`,
        granularityMin: 10,
      })
    }
  } else {
    for (const row of weekly) {
      windows.push({
        startLocal: `${localDate}T${row.startTime}`,
        endLocal: `${localDate}T${row.endTime}`,
        granularityMin: row.slotSizeMin,
      })
    }
  }

  const slots: Slot[] = []

  // Existing appointments
  const existing = await db
    .select({
      startTime: appointments.startTime,
      endTime: appointments.endTime,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.status, "CONFIRMED"),
        gt(appointments.endTime, dayStartUtc),
        lt(appointments.startTime, dayEndUtc)
      )
    )

  for (const w of windows) {
    let cursorLocal = new Date(w.startLocal)
    const endLocal = new Date(w.endLocal)

    while (isBefore(cursorLocal, endLocal)) {
      const startLocal = cursorLocal
      const endLocalAppt = addMinutes(startLocal, apptType.durationMin)
      const startUtc = fromZonedTime(startLocal, CLINIC_TZ)
      const endUtc = fromZonedTime(endLocalAppt, CLINIC_TZ)

      // Buffers
      const blockStartUtc = fromZonedTime(
        addMinutes(startLocal, -apptType.bufferBeforeMin),
        CLINIC_TZ
      )
      const blockEndUtc = fromZonedTime(
        addMinutes(endLocalAppt, apptType.bufferAfterMin),
        CLINIC_TZ
      )

      const overlaps = existing.some(
        (e) => !(e.endTime <= blockStartUtc || e.startTime >= blockEndUtc)
      )

      if (!overlaps) {
        slots.push({
          startUtc: startUtc.toISOString(),
          endUtc: endUtc.toISOString(),
        })
      }

      cursorLocal = addMinutes(cursorLocal, w.granularityMin)
    }
  }

  return slots
}

// Attempt booking — relies on DB exclusion constraint to prevent race conditions.
export async function bookAppointment({
  patientId,
  doctorId,
  appointmentTypeId,
  startUtc,
}: {
  patientId: string
  doctorId: string
  appointmentTypeId: string
  startUtc: string // ISO UTC
}) {
  const apptType = (
    await db
      .select()
      .from(appointmentTypes)
      .where(eq(appointmentTypes.id, appointmentTypeId))
  )[0]
  if (!apptType) throw new Error("Invalid appointment type")

  const start = new Date(startUtc)
  const end = addMinutes(start, apptType.durationMin)

  try {
    const [created] = await db
      .insert(appointments)
      .values({
        patientId,
        doctorId,
        appointmentTypeId,
        startTime: start,
        endTime: end,
        status: "CONFIRMED",
      })
      .returning()

    return { ok: true, appointment: created }
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (String(err.message ?? err).includes("appointments_no_overlap")) {
        return {
          ok: false,
          error:
            "This time slot has just been taken. Please pick another.",
        } as const
      }
      throw err
    }
    console.error("Unknown booking error", err)
    return { ok: false, error: "Unknown booking error" } as const
  }
}

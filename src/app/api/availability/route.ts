import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { dailyAvailabilities, appointments } from "~/server/db/schema";
import { and, eq, gt, lt } from "drizzle-orm";
import { z } from "zod";
import { addMinutes, isBefore, eachDayOfInterval, format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

// 🟢 clinic timezone (adjust if needed)
const CLINIC_TZ = "Europe/Istanbul";

// ---- Query schemas ----
const SingleDaySchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

const RangeSchema = z.object({
  doctorId: z.string().uuid(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const MonthSchema = z.object({
  doctorId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(), // YYYY-MM, optional
});

// ---- Helper: build slots for a given local date (YYYY-MM-DD) ----
async function computeSlotsForDate(doctorId: string, dateStr: string) {
  const rows = await db
    .select()
    .from(dailyAvailabilities)
    .where(eq(dailyAvailabilities.doctorId, doctorId));

  const todays = rows.filter((r) => r.date === dateStr);
  if (todays.length === 0) {
    return { slots: [] as Array<{ startUtc: string; endUtc: string; isBooked: boolean }> };
  }

  const dayStartUtc = fromZonedTime(new Date(`${dateStr}T00:00:00`), CLINIC_TZ);
  const dayEndUtc = fromZonedTime(new Date(`${dateStr}T23:59:59`), CLINIC_TZ);

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
        lt(appointments.startTime, dayEndUtc),
      ),
    );

  const slots: { startUtc: string; endUtc: string; isBooked: boolean }[] = [];

  for (const row of todays) {
    const startLocal = new Date(`${dateStr}T${row.startTime}`);
    const endLocal = new Date(`${dateStr}T${row.endTime}`);
    const step = row.slotSizeMin ?? 15;

    let cursor = startLocal;
    while (isBefore(cursor, endLocal)) {
      const slotStart = cursor;
      const slotEnd = addMinutes(slotStart, step);

      const startUtc = fromZonedTime(slotStart, CLINIC_TZ).toISOString();
      const endUtc = fromZonedTime(slotEnd, CLINIC_TZ).toISOString();

      const overlaps = existing.some(
        (appt) =>
          !(appt.endTime <= new Date(startUtc) || appt.startTime >= new Date(endUtc)),
      );

      slots.push({ startUtc, endUtc, isBooked: overlaps });
      cursor = slotEnd;
    }
  }

  return { slots };
}

// ---- Handler ----
export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // Try single-day first
  const single = SingleDaySchema.safeParse({
    doctorId: url.searchParams.get("doctorId"),
    date: url.searchParams.get("date"),
  });

  if (single.success) {
    const { doctorId, date } = single.data;
    const { slots } = await computeSlotsForDate(doctorId, date);
    return NextResponse.json({ slots });
  }

  // Try weekly range
  const range = RangeSchema.safeParse({
    doctorId: url.searchParams.get("doctorId"),
    weekStart: url.searchParams.get("weekStart"),
    weekEnd: url.searchParams.get("weekEnd"),
  });

  if (range.success) {
    const { doctorId, weekStart, weekEnd } = range.data;

    const days = eachDayOfInterval({
      start: new Date(`${weekStart}T00:00:00`),
      end: new Date(`${weekEnd}T00:00:00`),
    });

    const availability: Array<{
      date: string;
      totalSlots: number;
      freeSlots: number;
      hasSlots: boolean;
    }> = [];

    for (const d of days) {
      const dStr = format(d, "yyyy-MM-dd");
      const { slots } = await computeSlotsForDate(doctorId, dStr);
      const totalSlots = slots.length;
      const freeSlots = slots.filter((s) => !s.isBooked).length;
      availability.push({
        date: dStr,
        totalSlots,
        freeSlots,
        hasSlots: freeSlots > 0,
      });
    }

    return NextResponse.json({ availability });
  }

  // Try monthly view (with fallback to current month)
   const month = MonthSchema.safeParse({
    doctorId: url.searchParams.get("doctorId"),
    month: url.searchParams.get("month") ?? undefined,
  });

  if (month.success) {
    const { doctorId } = month.data;
    let { month: monthStr } = month.data;

    // If no month param, default to current month in clinic TZ
    if (!monthStr) {
      const now = fromZonedTime(new Date(), CLINIC_TZ);
      monthStr = now.toISOString().slice(0, 7); // YYYY-MM
    }

    // ✅ Ensure split parts are always strings
    const parts = monthStr.split("-");
    const yearStr = parts[0] ?? "";
    const monthNumStr = parts[1] ?? "";

    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthNumStr, 10);

    if (!yearStr || !monthNumStr || isNaN(year) || isNaN(monthNum)) {
      return NextResponse.json({ error: "Invalid month values" }, { status: 400 });
    }

    const start = new Date(Date.UTC(year, monthNum - 1, 1));
    const end = new Date(Date.UTC(year, monthNum, 0));

    const days = eachDayOfInterval({ start, end });

    const availability: Array<{
      date: string;
      totalSlots: number;
      freeSlots: number;
      hasSlots: boolean;
    }> = [];

    for (const d of days) {
      const dStr = format(d, "yyyy-MM-dd");
      const { slots } = await computeSlotsForDate(doctorId, dStr);
      const totalSlots = slots.length;
      const freeSlots = slots.filter((s) => !s.isBooked).length;
      availability.push({
        date: dStr,
        totalSlots,
        freeSlots,
        hasSlots: freeSlots > 0,
      });
    }

    return NextResponse.json({ availability });
  }
  return NextResponse.json(
    {
      error:
        "Provide either (doctorId, date) OR (doctorId, weekStart, weekEnd) OR (doctorId, month).",
    },
    { status: 400 },
  );
}

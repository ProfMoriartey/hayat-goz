import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { dailyAvailabilities } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { addMinutes, isBefore } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

// 🟢 clinic timezone (adjust if needed)
const CLINIC_TZ = "Europe/Istanbul";

const QuerySchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = QuerySchema.safeParse({
    doctorId: url.searchParams.get("doctorId"),
    date: url.searchParams.get("date"),
  });

  if (!query.success) {
    return NextResponse.json(query.error.format(), { status: 400 });
  }

  const { doctorId, date } = query.data;

  // Pull any daily availability rows for this doctor/date
  const rows = await db
    .select()
    .from(dailyAvailabilities)
    .where(eq(dailyAvailabilities.doctorId, doctorId));

  // Filter by date string
  const todays = rows.filter((r) => r.date === date);

  if (todays.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  // Expand rows into slots
  const slots: { startUtc: string; endUtc: string }[] = [];

  for (const row of todays) {
    const startLocal = new Date(`${date}T${row.startTime}`);
    const endLocal = new Date(`${date}T${row.endTime}`);
    const step = row.slotSizeMin ?? 15;

    let cursor = startLocal;
    while (isBefore(cursor, endLocal)) {
      const slotStart = cursor;
      const slotEnd = addMinutes(slotStart, step);

      const startUtc = fromZonedTime(slotStart, CLINIC_TZ).toISOString();
      const endUtc = fromZonedTime(slotEnd, CLINIC_TZ).toISOString();

      slots.push({ startUtc, endUtc });
      cursor = slotEnd;
    }
  }

  return NextResponse.json({ slots });
}

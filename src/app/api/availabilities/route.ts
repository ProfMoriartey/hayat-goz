import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { db } from "~/server/db"
import { availabilities } from "~/server/db/schema"
import { z } from "zod"

const AvailabilitySchema = z.object({
  doctorId: z.string().uuid(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(), // "09:00"
  endTime: z.string(),   // "17:00"
  slotSizeMin: z.number().min(5),
})

export async function GET() {
  const all = await db.select().from(availabilities)
  return NextResponse.json({ availabilities: all })
}

export async function POST(req: NextRequest) {
  const json = (await req.json()) as unknown
  const parsed = AvailabilitySchema.parse(json)

  const [created] = await db.insert(availabilities).values(parsed).returning()
  return NextResponse.json({ availability: created })
}

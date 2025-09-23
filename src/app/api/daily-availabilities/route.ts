import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { db } from "~/server/db"
import { dailyAvailabilities } from "~/server/db/schema"
import { z } from "zod"
import { eq } from "drizzle-orm"

const Schema = z.object({
  doctorId: z.string().uuid(),
  date: z.string(), // YYYY-MM-DD
  startTime: z.string(), // "09:00"
  endTime: z.string(),
  slotSizeMin: z.number().min(5),
})

export async function GET() {
  const all = await db.select().from(dailyAvailabilities)
  return NextResponse.json({ availabilities: all })
}

export async function POST(req: NextRequest) {
  const json = (await req.json()) as unknown
  const parsed = Schema.parse(json)

  const [created] = await db.insert(dailyAvailabilities).values(parsed).returning()
  return NextResponse.json({ availability: created })
}

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { db } from "~/server/db"
import { appointmentTypes } from "~/server/db/schema"
import { z } from "zod"
import { eq } from "drizzle-orm"

const AppointmentTypeSchema = z.object({
  name: z.string().min(2),
  durationMin: z.number().min(1),
  bufferBeforeMin: z.number().min(0).default(0),
  bufferAfterMin: z.number().min(0).default(0),
})

export async function GET() {
  const all = await db.select().from(appointmentTypes)
  return NextResponse.json({ appointmentTypes: all })
}

export async function POST(req: NextRequest) {
  const json = (await req.json()) as unknown
  const parsed = AppointmentTypeSchema.parse(json)

  const [created] = await db.insert(appointmentTypes).values(parsed).returning()
  return NextResponse.json({ appointmentType: created })
}

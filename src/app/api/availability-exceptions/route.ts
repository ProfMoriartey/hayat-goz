import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { db } from "~/server/db"
import { availabilityExceptions } from "~/server/db/schema"
import { z } from "zod"

const ExceptionSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string(), // "2025-09-24"
  isClosed: z.boolean().default(false),
  windows: z.string().optional(), // "09:00-12:00,13:00-15:00"
})

export async function GET() {
  const all = await db.select().from(availabilityExceptions)
  return NextResponse.json({ exceptions: all })
}

export async function POST(req: NextRequest) {
  const json = (await req.json()) as unknown
  const parsed = ExceptionSchema.parse(json)

 const [created] = await db
  .insert(availabilityExceptions)
  .values({
    doctorId: parsed.doctorId,
    date: new Date(parsed.date), // 👈 convert string → Date
    isClosed: parsed.isClosed,
    windows: parsed.windows,
  })
  .returning()

  return NextResponse.json({ exception: created })
}

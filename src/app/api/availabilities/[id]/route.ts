import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { db } from "~/server/db"
import { availabilities } from "~/server/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const ParamsSchema = z.object({ id: z.string().uuid() })

const AvailabilitySchema = z.object({
  doctorId: z.string().uuid(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  slotSizeMin: z.number().min(5),
})

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = ParamsSchema.parse(await context.params)
  const json = (await req.json()) as unknown
  const parsed = AvailabilitySchema.parse(json)

  const [updated] = await db
    .update(availabilities)
    .set(parsed)
    .where(eq(availabilities.id, id))
    .returning()

  return NextResponse.json({ availability: updated })
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = ParamsSchema.parse(await context.params)
  await db.delete(availabilities).where(eq(availabilities.id, id))
  return NextResponse.json({ success: true })
}

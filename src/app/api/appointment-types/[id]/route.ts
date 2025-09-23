import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { db } from "~/server/db"
import { appointmentTypes } from "~/server/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const ParamsSchema = z.object({ id: z.string().uuid() })

const AppointmentTypeSchema = z.object({
  name: z.string().min(2),
  durationMin: z.number().min(1),
  bufferBeforeMin: z.number().min(0),
  bufferAfterMin: z.number().min(0),
})

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = ParamsSchema.parse(await context.params)
  const json = (await req.json()) as unknown
  const parsed = AppointmentTypeSchema.parse(json)

  const [updated] = await db
    .update(appointmentTypes)
    .set(parsed)
    .where(eq(appointmentTypes.id, id))
    .returning()

  return NextResponse.json({ appointmentType: updated })
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = ParamsSchema.parse(await context.params)
  await db.delete(appointmentTypes).where(eq(appointmentTypes.id, id))
  return NextResponse.json({ success: true })
}

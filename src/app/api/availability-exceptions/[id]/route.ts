import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { db } from "~/server/db"
import { availabilityExceptions } from "~/server/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const ParamsSchema = z.object({ id: z.string().uuid() })

const ExceptionSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string(),
  isClosed: z.boolean().default(false),
  windows: z.string().optional(),
})

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = ParamsSchema.parse(await context.params)
  const json = (await req.json()) as unknown
  const parsed = ExceptionSchema.parse(json)

const [updated] = await db
  .update(availabilityExceptions)
  .set({
    doctorId: parsed.doctorId,
    date: new Date(parsed.date), // 👈 ensure Date
    isClosed: parsed.isClosed,
    windows: parsed.windows,
  })
  .where(eq(availabilityExceptions.id, id))
  .returning()
  return NextResponse.json({ exception: updated })
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = ParamsSchema.parse(await context.params)
  await db.delete(availabilityExceptions).where(eq(availabilityExceptions.id, id))
  return NextResponse.json({ success: true })
}

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { db } from "~/server/db"
import { dailyAvailabilities } from "~/server/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const ParamsSchema = z.object({ id: z.string().uuid() })

const Schema = z.object({
  doctorId: z.string().uuid(),
  date: z.string(), // YYYY-MM-DD
  startTime: z.string(), // "09:00"
  endTime: z.string(),
  slotSizeMin: z.number().min(5),
})

// ✅ Update
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = ParamsSchema.parse(await context.params)
  const json = (await req.json()) as unknown
  const parsed = Schema.parse(json)

  const [updated] = await db
    .update(dailyAvailabilities)
    .set(parsed)
    .where(eq(dailyAvailabilities.id, id))
    .returning()

  return NextResponse.json({ availability: updated })
}

// ❌ Delete
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = ParamsSchema.parse(await context.params)
  await db.delete(dailyAvailabilities).where(eq(dailyAvailabilities.id, id))
  return NextResponse.json({ success: true })
}

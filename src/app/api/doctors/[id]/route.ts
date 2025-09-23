import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { db } from "~/server/db"
import { doctors } from "~/server/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const DoctorSchema = z.object({
  displayName: z.string().min(2),
  specialties: z.string().optional(),
  languages: z.string().optional(),
})

const ParamsSchema = z.object({ id: z.string().uuid() })

export async function PUT(req: NextRequest, context: unknown) {
  const { params } = context as { params: unknown }
  const { id } = ParamsSchema.parse(params)

  const json = (await req.json()) as unknown
  const parsed = DoctorSchema.parse(json)

  const [updated] = await db
    .update(doctors)
    .set({
      displayName: parsed.displayName,
      specialties: parsed.specialties,
      languages: parsed.languages,
    })
    .where(eq(doctors.id, id))
    .returning()

  return NextResponse.json({ doctor: updated })
}

export async function DELETE(_req: NextRequest, context: unknown) {
  const { params } = context as { params: unknown }
  const { id } = ParamsSchema.parse(params)

  await db.delete(doctors).where(eq(doctors.id, id))
  return NextResponse.json({ success: true })
}

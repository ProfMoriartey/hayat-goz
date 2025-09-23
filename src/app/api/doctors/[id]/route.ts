import { NextResponse } from "next/server"
import { db } from "~/server/db"
import { doctors } from "~/server/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const DoctorSchema = z.object({
    displayName: z.string().min(2),
    specialties: z.string().optional(),
    languages: z.string().optional(),
  })
  const parsed = DoctorSchema.parse(body)

  const [updated] = await db
    .update(doctors)
    .set({
      displayName: parsed.displayName,
      specialties: parsed.specialties,
      languages: parsed.languages,
    })
    .where(eq(doctors.id, params.id))
    .returning()

  return NextResponse.json({ doctor: updated })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await db.delete(doctors).where(eq(doctors.id, params.id))
  return NextResponse.json({ success: true })
}

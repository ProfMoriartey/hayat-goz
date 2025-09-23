import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { db } from "~/server/db"
import { doctors } from "~/server/db/schema"
import { z } from "zod"

const DoctorSchema = z.object({
  displayName: z.string().min(2),
  specialties: z.string().optional(),
  languages: z.string().optional(),
})

export async function GET() {
  const all = await db.select().from(doctors)
  return NextResponse.json({ doctors: all })
}

export async function POST(req: NextRequest) {
  const json = (await req.json()) as unknown
  const parsed = DoctorSchema.parse(json)

  const [doc] = await db.insert(doctors).values(parsed).returning()
  return NextResponse.json({ doctor: doc })
}

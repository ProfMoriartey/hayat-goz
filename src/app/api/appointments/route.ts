import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { bookAppointment } from "~/lib/scheduling"

const BodySchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  appointmentTypeId: z.string().uuid(),
  startUtc: z.string().refine((s) => !isNaN(Date.parse(s)), "Invalid ISO date"),
})

export async function POST(req: NextRequest) {
  const json = (await req.json()) as unknown
  const parsed = BodySchema.parse(json)

  const result = await bookAppointment(parsed)
  if (!result.ok) return NextResponse.json(result, { status: 409 })
  return NextResponse.json(result)
}

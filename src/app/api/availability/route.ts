import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getAvailableSlots } from "~/lib/scheduling"

const QuerySchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTypeId: z.string().uuid(),
})

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const parsed = QuerySchema.parse({
    doctorId: url.searchParams.get("doctorId"),
    date: url.searchParams.get("date"),
    appointmentTypeId: url.searchParams.get("appointmentTypeId"),
  })

  const slots = await getAvailableSlots({
    doctorId: parsed.doctorId,
    localDate: parsed.date, // mapping date → localDate
    appointmentTypeId: parsed.appointmentTypeId,
  })

  return NextResponse.json({ slots })
}

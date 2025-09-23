import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlots } from "~/lib/scheduling";


const QuerySchema = z.object({
  doctorId: z.string().uuid(),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),  // 👈 rename here
  appointmentTypeId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
const url = new URL(req.url);
const parsed = QuerySchema.safeParse({
doctorId: url.searchParams.get("doctorId"),
date: url.searchParams.get("date"),
appointmentTypeId: url.searchParams.get("appointmentTypeId"),
});
if (!parsed.success) {
return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
const slots = await getAvailableSlots(parsed.data);
return NextResponse.json({ slots });
}
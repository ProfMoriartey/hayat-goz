import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bookAppointment } from "~/lib/scheduling";


const BodySchema = z.object({
patientId: z.string().uuid(),
doctorId: z.string().uuid(),
appointmentTypeId: z.string().uuid(),
startUtc: z.string().refine((s) => !isNaN(Date.parse(s)), "Invalid ISO date"),
});


export async function POST(req: NextRequest) {
const body = await req.json();
const parsed = BodySchema.safeParse(body);
if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });


const result = await bookAppointment(parsed.data);
if (!result.ok) return NextResponse.json(result, { status: 409 });
return NextResponse.json(result);
}
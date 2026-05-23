import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pmsRecordSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const records = await prisma.pMSRecord.findMany({
    where: { vehicleId: id },
    orderBy: { serviceDate: "desc" },
  });

  return NextResponse.json(
    records.map((r) => ({ ...r, items: JSON.parse(r.items) }))
  );
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = pmsRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { items, serviceDate, mileage, nextServiceDate, nextServiceMileage, nextServiceNote, ...rest } = parsed.data;
  const mileageValue = mileage == null ? null : Number(mileage);

  const record = await prisma.pMSRecord.create({
    data: {
      ...rest,
      vehicleId: id,
      serviceDate: new Date(serviceDate),
      mileage: mileageValue,
      receiptImagePath: body.receiptImagePath ?? null,
      items: JSON.stringify(items),
      nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
      nextServiceMileage: nextServiceMileage ?? null,
      nextServiceNote: nextServiceNote ?? null,
    },
  });

  return NextResponse.json({ ...record, items: JSON.parse(record.items) }, { status: 201 });
}

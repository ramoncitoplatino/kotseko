import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fuelLogSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

async function getOwnedVehicle(vehicleId: string, userId: string) {
  return prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const vehicle = await getOwnedVehicle(id, session.user.id);
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const logs = await prisma.fuelLog.findMany({
    where: { vehicleId: id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(logs);
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const vehicle = await getOwnedVehicle(id, session.user.id);
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = fuelLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const { date, ...rest } = parsed.data;
    const log = await prisma.fuelLog.create({
      data: { ...rest, vehicleId: id, date: new Date(date) },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

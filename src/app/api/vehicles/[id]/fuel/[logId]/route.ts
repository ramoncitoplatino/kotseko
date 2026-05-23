import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string; logId: string }> };

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, logId } = await params;

  const log = await prisma.fuelLog.findFirst({
    where: { id: logId, vehicleId: id, vehicle: { userId: session.user.id } },
  });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.fuelLog.delete({ where: { id: logId } });
  return new NextResponse(null, { status: 204 });
}

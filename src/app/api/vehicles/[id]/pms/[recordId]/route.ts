import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string; recordId: string }> };

async function getOwnedRecord(recordId: string, vehicleId: string, userId: string) {
  return prisma.pMSRecord.findFirst({
    where: {
      id: recordId,
      vehicleId,
      vehicle: { userId },
    },
  });
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, recordId } = await params;
  const record = await getOwnedRecord(recordId, id, session.user.id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...record, items: JSON.parse(record.items) });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, recordId } = await params;
  const record = await getOwnedRecord(recordId, id, session.user.id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.pMSRecord.delete({ where: { id: recordId } });
  return new NextResponse(null, { status: 204 });
}

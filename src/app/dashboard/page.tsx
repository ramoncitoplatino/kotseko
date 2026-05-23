import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/shared/Navbar";
import VehicleList from "@/components/vehicles/VehicleList";
import DriveBackupButton from "@/components/drive/DriveBackupButton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { VehicleWithCount, ReminderStatus } from "@/types";

function getReminderStatus(
  latestPMS: { nextServiceDate: Date | null; nextServiceMileage: number | null } | undefined,
  latestOdometer: number | null,
): ReminderStatus | null {
  if (!latestPMS) return null;
  const today = new Date();

  if (latestPMS.nextServiceDate) {
    const daysLeft = Math.ceil((new Date(latestPMS.nextServiceDate).getTime() - today.getTime()) / 86_400_000);
    if (daysLeft < 0) return { level: "overdue", message: "Service overdue" };
    if (daysLeft <= 30) return { level: "soon", message: `Due in ${daysLeft}d` };
  }

  if (latestPMS.nextServiceMileage && latestOdometer !== null) {
    const kmLeft = latestPMS.nextServiceMileage - latestOdometer;
    if (kmLeft <= 0) return { level: "overdue", message: "Service overdue" };
    if (kmLeft <= 1000) return { level: "soon", message: `Due in ${kmLeft.toLocaleString()} km` };
  }

  return null;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const raw = await prisma.vehicle.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { pmsRecords: true } },
      pmsRecords: {
        orderBy: { serviceDate: "desc" },
        take: 1,
        select: { nextServiceDate: true, nextServiceMileage: true },
      },
      fuelLogs: {
        orderBy: { date: "desc" },
        take: 1,
        select: { odometer: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const vehicles: VehicleWithCount[] = raw.map((v) => {
    const { pmsRecords, fuelLogs, ...rest } = v;
    const latestOdometer = fuelLogs[0]?.odometer ?? null;
    return {
      ...rest,
      reminder: getReminderStatus(pmsRecords[0], latestOdometer),
    };
  });

  const totalRecords = vehicles.reduce((sum, v) => sum + v._count.pmsRecords, 0);

  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar userName={session.user.name} />

      {/* Blue hero header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-blue-300 text-sm font-medium mb-1">
                Welcome back, {session.user.name?.split(" ")[0] ?? "there"} 👋
              </p>
              <h1 className="text-2xl font-bold text-white">My Garage</h1>
              {vehicles.length > 0 && (
                <div className="flex gap-4 mt-3">
                  <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center">
                    <p className="text-white font-bold text-lg leading-none">{vehicles.length}</p>
                    <p className="text-blue-200 text-xs mt-0.5">Vehicle{vehicles.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-3 py-1.5 text-center">
                    <p className="text-white font-bold text-lg leading-none">{totalRecords}</p>
                    <p className="text-blue-200 text-xs mt-0.5">PMS Record{totalRecords !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              )}
            </div>
            <Link href="/vehicles/new">
              <Button className="gap-2 bg-white text-blue-800 hover:bg-blue-50 border-0 shadow-md font-semibold">
                <Plus className="h-4 w-4" />
                Add Vehicle
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-7">
        <div className="flex justify-end mb-5">
          <DriveBackupButton />
        </div>
        <VehicleList vehicles={vehicles} />
      </main>
    </div>
  );
}

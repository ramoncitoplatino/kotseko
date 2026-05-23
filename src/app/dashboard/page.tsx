import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/shared/Navbar";
import VehicleList from "@/components/vehicles/VehicleList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { VehicleWithCount } from "@/types";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { pmsRecords: true } } },
    orderBy: { createdAt: "desc" },
  }) as VehicleWithCount[];

  const totalRecords = vehicles.reduce((sum, v) => sum + v._count.pmsRecords, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name} />
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Garage</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {vehicles.length === 0
                ? "No vehicles registered yet"
                : `${vehicles.length} vehicle${vehicles.length !== 1 ? "s" : ""} · ${totalRecords} PMS record${totalRecords !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link href="/vehicles/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          </Link>
        </div>

        <VehicleList vehicles={vehicles} />
      </main>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/shared/Navbar";
import FuelLogForm from "@/components/fuel/FuelLogForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type PageProps = { params: Promise<{ id: string }> };

export default async function NewFuelLogPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!vehicle) notFound();

  // Get the most recent odometer reading for the hint
  const lastLog = await prisma.fuelLog.findFirst({
    where: { vehicleId: id },
    orderBy: { date: "desc" },
    select: { odometer: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name} />
      <main className="max-w-lg mx-auto px-4 py-8">
        <Link
          href={`/vehicles/${id}?tab=fuel`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 gap-0.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {vehicle.year} {vehicle.make} {vehicle.model}
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Log Fill-up</h1>
          <p className="text-sm text-gray-500 mb-6">
            {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.plateNumber}
          </p>
          <FuelLogForm vehicleId={id} lastOdometer={lastLog?.odometer ?? null} />
        </div>
      </main>
    </div>
  );
}

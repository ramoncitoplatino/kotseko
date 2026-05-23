import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/shared/Navbar";
import VehicleForm from "@/components/vehicles/VehicleForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditVehiclePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!vehicle) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={`/vehicles/${id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Vehicle
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Vehicle</h2>
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <VehicleForm
            vehicleId={id}
            defaultValues={{
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              plateNumber: vehicle.plateNumber,
              color: vehicle.color,
              vin: vehicle.vin ?? "",
              notes: vehicle.notes ?? "",
              imagePath: vehicle.imagePath ?? "",
            }}
          />
        </div>
      </main>
    </div>
  );
}

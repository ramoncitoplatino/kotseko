import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/shared/Navbar";
import PMSRecordList from "@/components/pms/PMSRecordList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Pencil, Plus } from "lucide-react";
import Image from "next/image";
import { FUEL_TYPE_STYLES, type FuelType } from "@/lib/fuelType";
import { formatCurrency } from "@/lib/utils";
import type { PMSRecordParsed } from "@/types";

type PageProps = { params: Promise<{ id: string }> };

export default async function VehicleDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId: session.user.id },
    include: { pmsRecords: { orderBy: { serviceDate: "desc" } } },
  });

  if (!vehicle) notFound();

  const pmsRecords: PMSRecordParsed[] = vehicle.pmsRecords.map((r) => ({
    ...r,
    items: JSON.parse(r.items),
  }));

  const fuel = FUEL_TYPE_STYLES[(vehicle.fuelType as FuelType) ?? "ICE"];
  const totalSpent = pmsRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const lastService = pmsRecords[0]?.serviceDate ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name} />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Back */}
        <Link href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-5 gap-0.5">
          <ChevronLeft className="h-4 w-4" /> Back to Garage
        </Link>

        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">

          {/* Image / gradient header */}
          <div className="relative h-52 sm:h-64 bg-gradient-to-br from-slate-700 to-slate-900">
            {vehicle.imagePath ? (
              <Image src={vehicle.imagePath}
                alt={`${vehicle.make} ${vehicle.model}`} fill
                className="object-cover opacity-90" unoptimized />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl opacity-10">🚗</span>
              </div>
            )}
            {/* Gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Edit button */}
            <Link href={`/vehicles/${id}/edit`}
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors border border-white/30">
              <Pencil className="h-3 w-3" /> Edit
            </Link>

            {/* Fuel badge */}
            <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold backdrop-blur-sm bg-white/85 ${fuel.badge}`}>
              <span>{fuel.icon}</span>
              <span>{vehicle.fuelType ?? "ICE"}</span>
            </div>

            {/* Title on image */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h2 className="text-2xl font-bold text-white drop-shadow">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-white/80 font-semibold tracking-widest text-sm mt-0.5">
                {vehicle.plateNumber}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            {[
              { label: "Color", value: vehicle.color },
              { label: "PMS Records", value: pmsRecords.length.toString() },
              { label: "Total Spent", value: pmsRecords.length ? formatCurrency(totalSpent) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="font-semibold text-gray-800 text-sm mt-0.5 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="px-5 py-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {vehicle.vin && (
              <div>
                <span className="text-gray-400">VIN </span>
                <span className="font-mono text-gray-700">{vehicle.vin}</span>
              </div>
            )}
            {lastService && (
              <div>
                <span className="text-gray-400">Last service </span>
                <span className="text-gray-700">
                  {new Date(lastService).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}
            {vehicle.notes && (
              <p className="w-full text-gray-500 text-sm">{vehicle.notes}</p>
            )}
          </div>
        </div>

        {/* PMS History */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">PMS History</h3>
          <Link href={`/vehicles/${id}/pms/new`}>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Record
            </Button>
          </Link>
        </div>

        <PMSRecordList records={pmsRecords} vehicleId={id} />
      </main>
    </div>
  );
}

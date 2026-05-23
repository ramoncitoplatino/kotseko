import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/shared/Navbar";
import PMSRecordList from "@/components/pms/PMSRecordList";
import FuelLogList from "@/components/fuel/FuelLogList";
import TabSwitcher from "@/components/shared/TabSwitcher";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Pencil, Plus, AlertTriangle, Clock } from "lucide-react";
import Image from "next/image";
import { FUEL_TYPE_STYLES, type FuelType } from "@/lib/fuelType";
import { formatCurrency, blobImageSrc } from "@/lib/utils";
import type { PMSRecordParsed, FuelLog, ReminderStatus } from "@/types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

function getReminderStatus(
  latestPMS: { nextServiceDate: Date | null; nextServiceMileage: number | null; nextServiceNote: string | null } | null,
  latestOdometer: number | null,
): ReminderStatus | null {
  if (!latestPMS) return null;
  const today = new Date();

  if (latestPMS.nextServiceDate) {
    const msLeft = new Date(latestPMS.nextServiceDate).getTime() - today.getTime();
    const daysLeft = Math.ceil(msLeft / 86_400_000);
    const note = latestPMS.nextServiceNote ? ` — ${latestPMS.nextServiceNote}` : "";
    if (daysLeft < 0) return { level: "overdue", message: `Service overdue${note}` };
    if (daysLeft <= 30) return { level: "soon", message: `Service due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}${note}` };
  }

  if (latestPMS.nextServiceMileage && latestOdometer !== null) {
    const kmLeft = latestPMS.nextServiceMileage - latestOdometer;
    const note = latestPMS.nextServiceNote ? ` — ${latestPMS.nextServiceNote}` : "";
    if (kmLeft <= 0) return { level: "overdue", message: `Service overdue at ${latestPMS.nextServiceMileage.toLocaleString()} km${note}` };
    if (kmLeft <= 1000) return { level: "soon", message: `Service due in ${kmLeft.toLocaleString()} km${note}` };
  }

  return null;
}

export default async function VehicleDetailPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const { id } = await params;
  const { tab = "maintenance" } = await searchParams;

  const [vehicle, fuelLogs] = await Promise.all([
    prisma.vehicle.findFirst({
      where: { id, userId: session.user.id },
      include: { pmsRecords: { orderBy: { serviceDate: "desc" } } },
    }),
    prisma.fuelLog.findMany({
      where: { vehicleId: id, vehicle: { userId: session.user.id } },
      orderBy: { date: "desc" },
    }),
  ]);

  if (!vehicle) notFound();

  const pmsRecords: PMSRecordParsed[] = vehicle.pmsRecords.map((r) => ({
    ...r,
    items: JSON.parse(r.items),
  }));

  const fuel = FUEL_TYPE_STYLES[(vehicle.fuelType as FuelType) ?? "ICE"];
  const totalSpent = pmsRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const lastService = pmsRecords[0]?.serviceDate ?? null;
  const latestOdometer = fuelLogs[0]?.odometer ?? null;

  const reminder = getReminderStatus(
    pmsRecords[0] ? {
      nextServiceDate: pmsRecords[0].nextServiceDate,
      nextServiceMileage: pmsRecords[0].nextServiceMileage,
      nextServiceNote: pmsRecords[0].nextServiceNote,
    } : null,
    latestOdometer,
  );

  const currentTab = tab === "fuel" ? "fuel" : "maintenance";

  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar userName={session.user.name} />
      <main className="max-w-4xl mx-auto px-4 py-8">

        <Link href="/dashboard"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-5 gap-0.5 font-medium">
          <ChevronLeft className="h-4 w-4" /> Back to Garage
        </Link>

        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm mb-5 overflow-hidden">

          {/* Image / gradient header */}
          <div className="relative h-52 sm:h-64 bg-gradient-to-br from-blue-800 to-blue-950">
            {vehicle.imagePath ? (
              <Image src={blobImageSrc(vehicle.imagePath)!}
                alt={`${vehicle.make} ${vehicle.model}`} fill
                className="object-cover opacity-90" unoptimized />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl opacity-10">🚗</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-transparent to-transparent" />

            <Link href={`/vehicles/${id}/edit`}
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors border border-white/30">
              <Pencil className="h-3 w-3" /> Edit
            </Link>

            <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold backdrop-blur-sm bg-white/90 ${fuel.badge}`}>
              <span>{fuel.icon}</span>
              <span>{vehicle.fuelType ?? "ICE"}</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h2 className="text-2xl font-bold text-white drop-shadow">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-blue-200 font-semibold tracking-widest text-sm mt-0.5">
                {vehicle.plateNumber}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 divide-x divide-blue-50 border-b border-blue-50 bg-blue-50/40">
            {[
              { label: "Color", value: vehicle.color },
              { label: "PMS Records", value: pmsRecords.length.toString() },
              { label: "Total Spent", value: pmsRecords.length ? formatCurrency(totalSpent) : "—" },
              { label: "Odometer", value: latestOdometer ? `${latestOdometer.toLocaleString()} km` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="px-3 py-3 text-center">
                <p className="text-xs text-blue-400 uppercase tracking-wide">{label}</p>
                <p className="font-bold text-blue-800 text-sm mt-0.5 truncate">{value}</p>
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
                <span className="text-gray-700 font-medium">
                  {new Date(lastService).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}
            {vehicle.notes && (
              <p className="w-full text-gray-500 text-sm">{vehicle.notes}</p>
            )}
          </div>
        </div>

        {/* Reminder banner */}
        {reminder && (
          <div className={`flex items-start gap-3 rounded-xl px-4 py-3 mb-5 border ${
            reminder.level === "overdue"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            {reminder.level === "overdue"
              ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              : <Clock className="h-4 w-4 mt-0.5 shrink-0" />}
            <div className="text-sm">
              <span className="font-semibold">{reminder.level === "overdue" ? "Overdue: " : "Reminder: "}</span>
              {reminder.message}
            </div>
          </div>
        )}

        {/* Tabs + action */}
        <div className="flex items-center justify-between mb-1">
          <TabSwitcher vehicleId={id} currentTab={currentTab} />
          <div className="mb-4">
            {currentTab === "maintenance" ? (
              <Link href={`/vehicles/${id}/pms/new`}>
                <Button size="sm" className="gap-1.5 shadow-sm">
                  <Plus className="h-3.5 w-3.5" /> Add Record
                </Button>
              </Link>
            ) : (
              <Link href={`/vehicles/${id}/fuel/new`}>
                <Button size="sm" className="gap-1.5 shadow-sm">
                  <Plus className="h-3.5 w-3.5" /> Log Fill-up
                </Button>
              </Link>
            )}
          </div>
        </div>

        {currentTab === "maintenance" ? (
          <PMSRecordList records={pmsRecords} vehicleId={id} />
        ) : (
          <FuelLogList logs={fuelLogs as FuelLog[]} vehicleId={id} />
        )}
      </main>
    </div>
  );
}

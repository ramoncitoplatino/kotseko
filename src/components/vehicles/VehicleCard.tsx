import Link from "next/link";
import Image from "next/image";
import { FUEL_TYPE_STYLES, type FuelType } from "@/lib/fuelType";
import { blobImageSrc } from "@/lib/utils";
import { AlertTriangle, Clock } from "lucide-react";
import type { VehicleWithCount } from "@/types";

interface VehicleCardProps {
  vehicle: VehicleWithCount;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const fuel = FUEL_TYPE_STYLES[(vehicle.fuelType as FuelType) ?? "ICE"];

  return (
    <Link href={`/vehicles/${vehicle.id}`} className="group block">
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm hover:shadow-lg hover:shadow-blue-100/60 hover:-translate-y-0.5 hover:border-blue-200 transition-all duration-200 overflow-hidden h-full flex flex-col">

        {/* Image */}
        <div className="relative h-44 bg-gradient-to-br from-blue-100 to-blue-200 shrink-0">
          {vehicle.imagePath ? (
            <Image src={blobImageSrc(vehicle.imagePath)!} alt={`${vehicle.make} ${vehicle.model}`}
              fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl opacity-25">🚗</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/30 to-transparent" />
          {/* Fuel type badge */}
          <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold backdrop-blur-sm bg-white/90 ${fuel.badge}`}>
            <span>{fuel.icon}</span>
            <span>{vehicle.fuelType ?? "ICE"}</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-blue-500 mt-0.5 font-semibold tracking-wider">
              {vehicle.plateNumber}
            </p>
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-2 h-2 rounded-full ${fuel.dot}`} />
            <span className="text-xs text-gray-500">{vehicle.color}</span>
          </div>

          {vehicle.vin && (
            <p className="text-xs text-gray-400 mt-1 font-mono truncate">{vehicle.vin}</p>
          )}

          <div className="mt-auto pt-3 border-t border-blue-50 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-400 shrink-0">
              {vehicle._count.pmsRecords === 0
                ? "No records yet"
                : `${vehicle._count.pmsRecords} PMS record${vehicle._count.pmsRecords !== 1 ? "s" : ""}`}
            </span>
            {vehicle.reminder ? (
              <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                vehicle.reminder.level === "overdue"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                {vehicle.reminder.level === "overdue"
                  ? <AlertTriangle className="h-3 w-3" />
                  : <Clock className="h-3 w-3" />}
                {vehicle.reminder.message}
              </span>
            ) : (
              <span className="text-xs text-blue-500 font-semibold group-hover:text-blue-700 transition-colors">
                View →
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

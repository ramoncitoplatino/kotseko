import Link from "next/link";
import Image from "next/image";
import { FUEL_TYPE_STYLES, type FuelType } from "@/lib/fuelType";
import { blobImageSrc } from "@/lib/utils";
import type { VehicleWithCount } from "@/types";

interface VehicleCardProps {
  vehicle: VehicleWithCount;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const fuel = FUEL_TYPE_STYLES[(vehicle.fuelType as FuelType) ?? "ICE"];

  return (
    <Link href={`/vehicles/${vehicle.id}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden h-full flex flex-col">

        {/* Image */}
        <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 shrink-0">
          {vehicle.imagePath ? (
            <Image src={blobImageSrc(vehicle.imagePath)!} alt={`${vehicle.make} ${vehicle.model}`}
              fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl opacity-20">🚗</span>
            </div>
          )}
          {/* Fuel type badge — overlaid on image */}
          <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold backdrop-blur-sm bg-white/80 ${fuel.badge}`}>
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
            <p className="text-sm text-gray-500 mt-0.5 font-medium tracking-wide">
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

          <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {vehicle._count.pmsRecords === 0
                ? "No records yet"
                : `${vehicle._count.pmsRecords} PMS record${vehicle._count.pmsRecords !== 1 ? "s" : ""}`}
            </span>
            <span className="text-xs text-blue-500 font-semibold group-hover:text-blue-600">
              View →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

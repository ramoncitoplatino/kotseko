import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Gauge, Calendar, Store } from "lucide-react";
import type { PMSRecordParsed } from "@/types";

interface PMSRecordCardProps {
  record: PMSRecordParsed;
  vehicleId: string;
}

export default function PMSRecordCard({ record, vehicleId }: PMSRecordCardProps) {
  return (
    <Link href={`/vehicles/${vehicleId}/pms/${record.id}`}>
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm px-4 py-3 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {record.shopName && (
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <Store className="h-3 w-3 shrink-0 text-blue-400" />
                <span className="truncate">{record.shopName}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-blue-400" />
                {formatDate(record.serviceDate)}
              </span>
              {record.mileage != null && (
                <span className="flex items-center gap-1">
                  <Gauge className="h-3 w-3 text-blue-400" />
                  {record.mileage.toLocaleString()} km
                </span>
              )}
            </div>
            <div className="mt-1.5 text-xs text-gray-400">
              {record.items.length} service item{record.items.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-blue-700">{formatCurrency(record.totalAmount)}</p>
            <p className="text-xs text-blue-500 mt-1 font-medium">View →</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

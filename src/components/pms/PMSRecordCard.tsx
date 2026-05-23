import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {record.shopName && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                  <Store className="h-3 w-3 shrink-0" />
                  <span className="truncate">{record.shopName}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(record.serviceDate)}
                </span>
                {record.mileage != null && (
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    {record.mileage.toLocaleString()} km
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {record.items.length} service item{record.items.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-gray-900">{formatCurrency(record.totalAmount)}</p>
              <p className="text-xs text-blue-600 mt-1">View →</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

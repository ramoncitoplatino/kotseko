import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import DeleteFuelLogButton from "./DeleteFuelLogButton";
import type { FuelLog } from "@/types";
import { Fuel, Gauge, Plus } from "lucide-react";

interface FuelLogListProps {
  logs: FuelLog[];
  vehicleId: string;
}

export default function FuelLogList({ logs, vehicleId }: FuelLogListProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-blue-100 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mx-auto mb-4">⛽</div>
        <h3 className="font-semibold text-gray-800 mb-1">No fuel logs yet</h3>
        <p className="text-sm text-gray-400 mb-5">Track your fill-ups to monitor fuel economy.</p>
        <Link href={`/vehicles/${vehicleId}/fuel/new`}>
          <Button size="sm">Log First Fill-up</Button>
        </Link>
      </div>
    );
  }

  // Build km/L stats — logs are newest-first
  const logsWithStats = logs.map((log, i) => {
    const prevLog = logs[i + 1];
    const kmTraveled = prevLog ? log.odometer - prevLog.odometer : null;
    const fuelEconomy = kmTraveled && kmTraveled > 0 ? kmTraveled / log.liters : null;
    return { ...log, kmTraveled, fuelEconomy };
  });

  const validEconomyReadings = logsWithStats.filter((l) => l.fuelEconomy !== null);
  const avgEconomy =
    validEconomyReadings.length > 0
      ? validEconomyReadings.reduce((s, l) => s + l.fuelEconomy!, 0) / validEconomyReadings.length
      : null;
  const totalFuelSpent = logs.reduce((s, l) => s + l.totalCost, 0);
  const totalLiters = logs.reduce((s, l) => s + l.liters, 0);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Fill-ups", value: logs.length.toString() },
          { label: "Total Spent", value: formatCurrency(totalFuelSpent) },
          { label: "Avg km/L", value: avgEconomy ? `${avgEconomy.toFixed(1)} km/L` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-blue-100 shadow-sm p-3 text-center">
            <p className="text-xs text-blue-400 uppercase tracking-wide">{label}</p>
            <p className="font-bold text-blue-800 text-sm mt-0.5 truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {logsWithStats.map((log) => (
          <div key={log.id} className="bg-white rounded-xl border border-blue-100 shadow-sm px-4 py-3 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-800">
                    {formatDate(log.date)}
                  </span>
                  {log.station && (
                    <span className="text-xs text-blue-500 truncate">{log.station}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Fuel className="h-3 w-3 text-blue-400" />
                    {log.liters.toFixed(1)}L · ₱{log.pricePerLiter.toFixed(2)}/L
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Gauge className="h-3 w-3 text-blue-400" />
                    {log.odometer.toLocaleString()} km
                  </span>
                  {log.fuelEconomy !== null && (
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                      log.fuelEconomy >= 12 ? "bg-green-50 text-green-700" :
                      log.fuelEconomy >= 8  ? "bg-amber-50 text-amber-700" :
                                              "bg-red-50 text-red-700"
                    }`}>
                      {log.fuelEconomy.toFixed(1)} km/L
                    </span>
                  )}
                </div>
                {log.notes && (
                  <p className="text-xs text-gray-400 mt-1">{log.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-sm text-blue-700">{formatCurrency(log.totalCost)}</span>
                <DeleteFuelLogButton vehicleId={vehicleId} logId={log.id} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-1">
        <p className="text-xs text-gray-400 mb-2">Total: {totalLiters.toFixed(1)}L logged</p>
        <Link href={`/vehicles/${vehicleId}/fuel/new`}>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Log Fill-up
          </Button>
        </Link>
      </div>
    </div>
  );
}

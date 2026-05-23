"use client";

import { useRouter } from "next/navigation";
import { Wrench, Fuel } from "lucide-react";

const TABS = [
  { id: "maintenance", label: "Maintenance", Icon: Wrench },
  { id: "fuel", label: "Fuel Log", Icon: Fuel },
];

interface TabSwitcherProps {
  vehicleId: string;
  currentTab: string;
}

export default function TabSwitcher({ vehicleId, currentTab }: TabSwitcherProps) {
  const router = useRouter();

  return (
    <div className="flex gap-1 bg-blue-50 rounded-xl p-1 mb-4">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => router.push(`/vehicles/${vehicleId}?tab=${id}`, { scroll: false })}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            currentTab === id
              ? "bg-white text-blue-700 shadow-sm"
              : "text-blue-400 hover:text-blue-600 hover:bg-white/60"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

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
    <div className="flex border-b border-gray-200 mb-4">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => router.push(`/vehicles/${vehicleId}?tab=${id}`, { scroll: false })}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            currentTab === id
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

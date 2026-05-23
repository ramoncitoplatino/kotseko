export type FuelType = "ICE" | "BEV" | "PHEV" | "HEV";

export const FUEL_TYPES: { value: FuelType; label: string; description: string }[] = [
  { value: "ICE",  label: "ICE",  description: "Internal Combustion Engine" },
  { value: "HEV",  label: "HEV",  description: "Hybrid Electric Vehicle" },
  { value: "PHEV", label: "PHEV", description: "Plug-in Hybrid Electric Vehicle" },
  { value: "BEV",  label: "BEV",  description: "Battery Electric Vehicle" },
];

export const FUEL_TYPE_STYLES: Record<FuelType, {
  badge: string;
  icon: string;
  dot: string;
}> = {
  ICE:  { badge: "bg-slate-100 text-slate-700 border-slate-200",   icon: "⛽", dot: "bg-slate-400" },
  HEV:  { badge: "bg-teal-50  text-teal-700  border-teal-200",     icon: "🍃", dot: "bg-teal-400"  },
  PHEV: { badge: "bg-blue-50  text-blue-700  border-blue-200",     icon: "🔌", dot: "bg-blue-400"  },
  BEV:  { badge: "bg-green-50 text-green-700 border-green-200",    icon: "⚡", dot: "bg-green-400" },
};

import VehicleCard from "./VehicleCard";
import EmptyState from "@/components/shared/EmptyState";
import type { VehicleWithCount } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface VehicleListProps {
  vehicles: VehicleWithCount[];
}

export default function VehicleList({ vehicles }: VehicleListProps) {
  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon="🚗"
        title="No vehicles yet"
        description="Register your first vehicle to start tracking PMS records."
        action={
          <Link href="/vehicles/new">
            <Button>Add Your First Vehicle</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {vehicles.map((v) => (
        <VehicleCard key={v.id} vehicle={v} />
      ))}
    </div>
  );
}

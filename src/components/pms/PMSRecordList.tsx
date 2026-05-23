import PMSRecordCard from "./PMSRecordCard";
import EmptyState from "@/components/shared/EmptyState";
import type { PMSRecordParsed } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PMSRecordListProps {
  records: PMSRecordParsed[];
  vehicleId: string;
}

export default function PMSRecordList({ records, vehicleId }: PMSRecordListProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon="🔧"
        title="No PMS records yet"
        description="Add your first PMS record by scanning a receipt or entering details manually."
        action={
          <Link href={`/vehicles/${vehicleId}/pms/new`}>
            <Button>Add First PMS Record</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {records.map((r) => (
        <PMSRecordCard key={r.id} record={r} vehicleId={vehicleId} />
      ))}
    </div>
  );
}

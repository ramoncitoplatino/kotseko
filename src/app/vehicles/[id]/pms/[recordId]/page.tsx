import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/shared/Navbar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronLeft, Calendar, Gauge, Store } from "lucide-react";
import { formatCurrency, formatDate, blobImageSrc } from "@/lib/utils";
import type { LineItem } from "@/types";
import Image from "next/image";
import DeletePMSRecordButton from "@/components/pms/DeletePMSRecordButton";

type PageProps = {
  params: Promise<{ id: string; recordId: string }>;
};

export default async function PMSRecordDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const { id, recordId } = await params;

  const record = await prisma.pMSRecord.findFirst({
    where: {
      id: recordId,
      vehicleId: id,
      vehicle: { userId: session.user.id },
    },
    include: { vehicle: true },
  });

  if (!record) notFound();

  const items: LineItem[] = JSON.parse(record.items);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={`/vehicles/${id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {record.vehicle.year} {record.vehicle.make} {record.vehicle.model}
        </Link>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">PMS Record</h2>
                {record.shopName && (
                  <p className="text-gray-600 flex items-center gap-1 mt-1">
                    <Store className="h-4 w-4" />
                    {record.shopName}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(record.totalAmount)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(record.serviceDate)}
              </Badge>
              {record.mileage != null ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  {record.mileage.toLocaleString()} km
                </Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
                  Mileage not recorded
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-700 mb-3">Services & Items</h3>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(item.price)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between items-center font-bold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(record.totalAmount)}</span>
            </div>
          </div>

          {/* Receipt Image */}
          {record.receiptImagePath && (
            <>
              <Separator />
              <div className="p-6">
                <h3 className="font-semibold text-gray-700 mb-3">Receipt Image</h3>
                <div className="rounded-lg overflow-hidden border bg-gray-50">
                  <Image
                    src={blobImageSrc(record.receiptImagePath)!}
                    alt="Receipt"
                    width={600}
                    height={400}
                    className="w-full object-contain"
                    unoptimized
                  />
                </div>
              </div>
            </>
          )}

          {/* Footer / Actions */}
          <div className="px-6 pb-6">
            <DeletePMSRecordButton vehicleId={id} recordId={recordId} />
          </div>
        </div>
      </main>
    </div>
  );
}

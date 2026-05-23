"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { pmsRecordSchema, type PMSRecordInput } from "@/lib/validations";
import { blobImageSrc } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Plus, Trash2, Loader2, ChevronLeft, Bell } from "lucide-react";
import Image from "next/image";
import type { OCRExtractedData } from "@/types";

interface ReceiptReviewFormProps {
  vehicleId: string;
  initialData: OCRExtractedData;
  imagePath: string | null;
  scanError?: string | null;
  onSuccess: () => void;
  onBack: () => void;
}

export default function ReceiptReviewForm({
  vehicleId,
  initialData,
  imagePath,
  scanError,
  onSuccess,
  onBack,
}: ReceiptReviewFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const mileageMissing = initialData.mileage === undefined || initialData.mileage === null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<PMSRecordInput>({
    resolver: zodResolver(pmsRecordSchema) as any,
    defaultValues: {
      shopName: initialData.shopName ?? "",
      serviceDate:
        initialData.serviceDate ?? new Date().toISOString().split("T")[0],
      mileage: initialData.mileage ?? ("" as unknown as number),
      totalAmount: initialData.totalAmount ?? 0,
      items:
        initialData.items.length > 0
          ? initialData.items
          : [{ name: "", price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/pms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, receiptImagePath: imagePath }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const json = await res.json();
        setSubmitError(json.error ? JSON.stringify(json.error) : "Failed to save. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to upload
      </button>

      <h2 className="text-xl font-bold text-gray-900 mb-1">Review Receipt Details</h2>
      <p className="text-sm text-gray-500 mb-5">
        {scanError
          ? "Scan failed — enter the details manually below."
          : initialData.rawText
          ? "Review and correct the extracted details below, then save."
          : "Enter the PMS details manually."}
      </p>

      {scanError && (
        <Alert className="mb-4 border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Scan error:</strong> {scanError}
          </AlertDescription>
        </Alert>
      )}

      {mileageMissing && (
        <Alert className="mb-5 border-yellow-400 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Mileage not found on receipt.</strong> Please enter the current odometer reading below.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Shop Name */}
        <div className="space-y-1">
          <Label htmlFor="shopName">Shop Name</Label>
          <Input
            id="shopName"
            placeholder="Auto Shop Name (optional)"
            {...form.register("shopName")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Service Date */}
          <div className="space-y-1">
            <Label htmlFor="serviceDate">Service Date *</Label>
            <Input
              id="serviceDate"
              type="date"
              {...form.register("serviceDate")}
            />
            {form.formState.errors.serviceDate && (
              <p className="text-red-500 text-sm">{form.formState.errors.serviceDate.message}</p>
            )}
          </div>

          {/* Mileage */}
          <div
            className={`space-y-1 ${
              mileageMissing ? "ring-2 ring-yellow-400 rounded-lg p-3 bg-yellow-50 -m-1" : ""
            }`}
          >
            <Label htmlFor="mileage">
              Mileage (km)
              {mileageMissing && (
                <span className="text-yellow-700 font-semibold ml-1">* Enter manually</span>
              )}
            </Label>
            <Input
              id="mileage"
              type="number"
              placeholder="e.g. 45000"
              autoFocus={mileageMissing}
              {...form.register("mileage")}
            />
            {form.formState.errors.mileage && (
              <p className="text-red-500 text-sm">{form.formState.errors.mileage.message?.toString()}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Line Items */}
        <div className="space-y-3">
          <Label>Services / Items *</Label>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <Input
                placeholder="Service or item name"
                className="flex-1"
                {...form.register(`items.${index}.name`)}
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                className="w-28 shrink-0"
                {...form.register(`items.${index}.price`)}
              />
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="text-gray-400 hover:text-red-500 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {form.formState.errors.items && (
            <p className="text-red-500 text-sm">
              {typeof form.formState.errors.items === "object" && "message" in form.formState.errors.items
                ? form.formState.errors.items.message
                : "Please fill in all item fields"}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: "", price: 0 })}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Item
          </Button>
        </div>

        {/* Total */}
        <div className="space-y-1">
          <Label htmlFor="totalAmount">Total Amount (PHP) *</Label>
          <Input
            id="totalAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...form.register("totalAmount")}
          />
          {form.formState.errors.totalAmount && (
            <p className="text-red-500 text-sm">{form.formState.errors.totalAmount.message}</p>
          )}
        </div>

        <Separator />

        {/* Next Service Reminder */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-gray-700 text-sm">Next Service Reminder <span className="text-gray-400 font-normal">(optional)</span></span>
          </div>
          <div className="space-y-1">
            <Label htmlFor="nextServiceNote">What service is due next?</Label>
            <Input id="nextServiceNote" placeholder="e.g. Oil change, PMS, Timing belt"
              {...form.register("nextServiceNote")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="nextServiceDate">Due Date</Label>
              <Input id="nextServiceDate" type="date" {...form.register("nextServiceDate")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nextServiceMileage">Due at Mileage (km)</Label>
              <Input id="nextServiceMileage" type="number" placeholder="e.g. 50000"
                {...form.register("nextServiceMileage")} />
            </div>
          </div>
          <p className="text-xs text-gray-400">Set either or both — you&apos;ll see a badge on your vehicle when it&apos;s due.</p>
        </div>

        <Separator />

        {/* Receipt image preview */}
        {imagePath && (
          <div className="space-y-1">
            <Label>Receipt Image</Label>
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              <Image
                src={blobImageSrc(imagePath)!}
                alt="Receipt"
                width={600}
                height={300}
                className="w-full object-contain max-h-48"
                unoptimized
              />
            </div>
          </div>
        )}

        {submitError && (
          <p className="text-red-500 text-sm">{submitError}</p>
        )}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving PMS Record...
            </>
          ) : (
            "Save PMS Record"
          )}
        </Button>
      </form>
    </div>
  );
}

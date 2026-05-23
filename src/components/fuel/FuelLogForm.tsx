"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fuelLogSchema, type FuelLogInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface FuelLogFormProps {
  vehicleId: string;
  lastOdometer?: number | null;
}

export default function FuelLogForm({ vehicleId, lastOdometer }: FuelLogFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<FuelLogInput>({
    resolver: zodResolver(fuelLogSchema) as any,
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      odometer: "" as unknown as number,
      liters: "" as unknown as number,
      totalCost: "" as unknown as number,
      pricePerLiter: 0,
      station: "",
      notes: "",
    },
  });

  const liters = Number(form.watch("liters"));
  const totalCost = Number(form.watch("totalCost"));
  const pricePerLiter = liters > 0 && totalCost > 0 ? (totalCost / liters).toFixed(2) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    setError("");
    const computed = { ...data, pricePerLiter: liters > 0 ? totalCost / liters : 0 };
    const res = await fetch(`/api/vehicles/${vehicleId}/fuel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(computed),
    });
    if (res.ok) {
      router.push(`/vehicles/${vehicleId}?tab=fuel`);
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      const msg = typeof json.error === "string" ? json.error : JSON.stringify(json.error ?? "Failed to save.");
      setError(msg);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="date">Date *</Label>
          <Input id="date" type="date" {...form.register("date")} />
          {form.formState.errors.date && (
            <p className="text-red-500 text-xs">{form.formState.errors.date.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="odometer">Odometer (km) *</Label>
          <Input id="odometer" type="number" placeholder="e.g. 45320"
            {...form.register("odometer")} />
          {lastOdometer && (
            <p className="text-xs text-gray-400">Last recorded: {lastOdometer.toLocaleString()} km</p>
          )}
          {form.formState.errors.odometer && (
            <p className="text-red-500 text-xs">{form.formState.errors.odometer.message?.toString()}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="liters">Liters Filled *</Label>
          <Input id="liters" type="number" step="0.01" placeholder="e.g. 30.5"
            {...form.register("liters")} />
          {form.formState.errors.liters && (
            <p className="text-red-500 text-xs">{form.formState.errors.liters.message?.toString()}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="totalCost">Total Cost (PHP) *</Label>
          <Input id="totalCost" type="number" step="0.01" placeholder="e.g. 2000"
            {...form.register("totalCost")} />
          {pricePerLiter && (
            <p className="text-xs text-gray-400">₱{pricePerLiter}/L</p>
          )}
          {form.formState.errors.totalCost && (
            <p className="text-red-500 text-xs">{form.formState.errors.totalCost.message?.toString()}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="station">Gas Station <span className="text-gray-400 font-normal">(optional)</span></Label>
        <Input id="station" placeholder="e.g. Shell EDSA, Petron BGC" {...form.register("station")} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes <span className="text-gray-400 font-normal">(optional)</span></Label>
        <Textarea id="notes" placeholder="Any additional notes..." rows={2} {...form.register("notes")} />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1">
          {form.formState.isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : "Save Fill-up"}
        </Button>
      </div>
    </form>
  );
}

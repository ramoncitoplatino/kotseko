"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { vehicleSchema, type VehicleInput } from "@/lib/validations";
import { blobImageSrc } from "@/lib/utils";
import { FUEL_TYPES, FUEL_TYPE_STYLES, type FuelType } from "@/lib/fuelType";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface VehicleFormProps {
  vehicleId?: string;
  defaultValues?: Partial<VehicleInput>;
}

export default function VehicleForm({ vehicleId, defaultValues }: VehicleFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [imagePath, setImagePath] = useState<string | null>(defaultValues?.imagePath ?? null);
  const [imagePreview, setImagePreview] = useState<string | null>(defaultValues?.imagePath ?? null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(vehicleId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema) as any,
    defaultValues: {
      make: "", model: "", year: new Date().getFullYear(),
      plateNumber: "", color: "", vin: "", fuelType: "ICE", notes: "",
      ...defaultValues,
    },
  });

  const selectedFuelType = form.watch("fuelType") as FuelType;

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) setImagePath(json.imagePath);
      else { setError(json.error ?? "Image upload failed"); setImagePreview(imagePath); }
    } catch {
      setError("Image upload failed"); setImagePreview(imagePath);
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setImagePath(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    setError("");
    const url = isEdit ? `/api/vehicles/${vehicleId}` : "/api/vehicles";
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, imagePath }),
    });
    if (res.ok) {
      const vehicle = await res.json();
      router.push(`/vehicles/${vehicle.id}`);
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      const msg = typeof json.error === "string"
        ? json.error
        : json.error
          ? JSON.stringify(json.error)
          : "Failed to save vehicle. Please try again.";
      setError(msg);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

      {/* Vehicle Photo */}
      <div className="space-y-2">
        <Label>Vehicle Photo <span className="text-gray-400 font-normal">(optional)</span></Label>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />

        {imagePreview ? (
          <div className="relative w-full h-52 rounded-xl overflow-hidden border bg-gray-100">
            <Image src={blobImageSrc(imagePreview) ?? imagePreview} alt="Vehicle" fill className="object-cover" unoptimized />
            {uploading ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            ) : (
              <button type="button" onClick={removeImage}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Camera, label: "Take Photo", ref: cameraInputRef },
              { icon: Upload, label: "Upload Photo", ref: fileInputRef },
            ].map(({ icon: Icon, label, ref }) => (
              <button key={label} type="button" onClick={() => ref.current?.click()}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl h-28 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all">
                <Icon className="h-6 w-6" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fuel Type Selector */}
      <div className="space-y-2">
        <Label>Powertrain Type *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FUEL_TYPES.map(({ value, label, description }) => {
            const styles = FUEL_TYPE_STYLES[value];
            const isSelected = selectedFuelType === value;
            return (
              <label key={value}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? `border-current ${styles.badge} shadow-sm`
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}>
                <input type="radio" value={value} {...form.register("fuelType")} className="sr-only" />
                <span className="text-2xl">{styles.icon}</span>
                <span className="font-bold text-sm">{label}</span>
                <span className={`text-[10px] text-center leading-tight ${isSelected ? "opacity-80" : "text-gray-400"}`}>
                  {description}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { id: "make", label: "Make *", placeholder: "Toyota" },
          { id: "model", label: "Model *", placeholder: "Innova" },
        ].map(({ id, label, placeholder }) => (
          <div key={id} className="space-y-1">
            <Label htmlFor={id}>{label}</Label>
            <Input id={id} placeholder={placeholder} {...form.register(id as keyof VehicleInput)} />
            {form.formState.errors[id as keyof VehicleInput] && (
              <p className="text-red-500 text-xs">{form.formState.errors[id as keyof VehicleInput]?.message as string}</p>
            )}
          </div>
        ))}

        <div className="space-y-1">
          <Label htmlFor="year">Year *</Label>
          <Input id="year" type="number" placeholder="2020" {...form.register("year")} />
          {form.formState.errors.year && (
            <p className="text-red-500 text-xs">{form.formState.errors.year.message as string}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="plateNumber">Plate Number *</Label>
          <Input id="plateNumber" placeholder="ABC 123" {...form.register("plateNumber")}
            className="uppercase" />
          {form.formState.errors.plateNumber && (
            <p className="text-red-500 text-xs">{form.formState.errors.plateNumber.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="color">Color *</Label>
          <Input id="color" placeholder="Silver" {...form.register("color")} />
          {form.formState.errors.color && (
            <p className="text-red-500 text-xs">{form.formState.errors.color.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="vin">VIN <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Input id="vin" placeholder="1HGBH41JXMN109186" {...form.register("vin")} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes <span className="text-gray-400 font-normal">(optional)</span></Label>
        <Textarea id="notes" placeholder="e.g. diesel variant, modified exhaust, LTO renewal due June..."
          rows={3} {...form.register("notes")} />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting || uploading} className="flex-1">
          {form.formState.isSubmitting
            ? (isEdit ? "Saving..." : "Adding...")
            : (isEdit ? "Save Changes" : "Add Vehicle")}
        </Button>
      </div>
    </form>
  );
}

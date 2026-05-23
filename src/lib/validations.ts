import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= 1900, "Year must be 1900 or later")
    .refine((v) => v <= new Date().getFullYear() + 1, "Year is too far in the future"),
  plateNumber: z.string().min(1, "Plate number is required"),
  color: z.string().min(1, "Color is required"),
  vin: z.string().optional(),
  fuelType: z.enum(["ICE", "BEV", "PHEV", "HEV"]).default("ICE"),
  notes: z.string().optional(),
  imagePath: z.string().nullable().optional(),
});

export const lineItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  price: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= 0, "Price must be 0 or more"),
});

export const pmsRecordSchema = z.object({
  shopName: z.string().optional(),
  serviceDate: z.string().min(1, "Service date is required"),
  mileage: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? undefined : Number(v)))
    .refine((v) => v === undefined || (!isNaN(v as number) && (v as number) >= 0), "Invalid mileage")
    .optional(),
  totalAmount: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= 0, "Total amount must be 0 or more"),
  items: z.array(lineItemSchema).min(1, "At least one service item is required"),
  nextServiceDate: z.string().optional(),
  nextServiceMileage: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? undefined : Number(v)))
    .refine((v) => v === undefined || (!isNaN(v as number) && (v as number) > 0), "Must be a positive number")
    .optional(),
  nextServiceNote: z.string().optional(),
});

export const fuelLogSchema = z.object({
  date: z.string().min(1, "Date is required"),
  odometer: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= 0, "Invalid odometer reading"),
  liters: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v > 0, "Liters must be greater than 0"),
  pricePerLiter: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= 0, "Invalid price per liter"),
  totalCost: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v > 0, "Total cost must be greater than 0"),
  station: z.string().optional(),
  notes: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type PMSRecordInput = z.infer<typeof pmsRecordSchema>;
export type LineItem = z.infer<typeof lineItemSchema>;
export type FuelLogInput = z.infer<typeof fuelLogSchema>;

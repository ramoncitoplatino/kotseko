import type { Vehicle, PMSRecord, FuelLog } from "@/generated/prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
}

export type { FuelLog };

export type ReminderStatus = {
  level: "overdue" | "soon";
  message: string;
};

export type VehicleWithCount = Vehicle & {
  _count: { pmsRecords: number };
  reminder?: ReminderStatus | null;
};

export type VehicleWithRecords = Vehicle & {
  pmsRecords: PMSRecord[];
};

export interface LineItem {
  name: string;
  price: number;
}

export interface PMSRecordParsed extends Omit<PMSRecord, "items"> {
  items: LineItem[];
}

export interface OCRExtractedData {
  shopName?: string;
  serviceDate?: string;
  mileage?: number;
  totalAmount?: number;
  items: LineItem[];
  rawText: string;
}

export interface FuelLogWithEconomy extends FuelLog {
  kmTraveled: number | null;
  fuelEconomy: number | null;
}

export interface ScanReceiptResponse {
  success: boolean;
  data?: OCRExtractedData;
  imagePath?: string;
  error?: string;
}

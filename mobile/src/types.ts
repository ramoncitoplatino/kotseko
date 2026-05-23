export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  color: string;
  fuelType: string;
  vin?: string | null;
  notes?: string | null;
  imagePath?: string | null;
  createdAt: string;
  _count?: { pmsRecords: number };
  reminder?: { level: "overdue" | "soon"; message: string } | null;
}

export interface LineItem {
  name: string;
  price: number;
}

export interface PMSRecord {
  id: string;
  vehicleId: string;
  shopName?: string | null;
  serviceDate: string;
  mileage?: number | null;
  totalAmount: number;
  items: LineItem[];
  receiptImagePath?: string | null;
  nextServiceDate?: string | null;
  nextServiceMileage?: number | null;
  nextServiceNote?: string | null;
  createdAt: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  station?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface OCRData {
  shopName?: string;
  serviceDate?: string;
  mileage?: number;
  totalAmount?: number;
  items: LineItem[];
  rawText: string;
}

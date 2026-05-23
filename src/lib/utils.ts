import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

export function blobImageSrc(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.includes("blob.vercel-storage.com")) {
    return `/api/blob-image?url=${encodeURIComponent(path)}`;
  }
  return path;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

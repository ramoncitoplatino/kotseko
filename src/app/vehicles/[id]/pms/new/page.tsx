"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import ReceiptUploader from "@/components/pms/ReceiptUploader";
import ReceiptReviewForm from "@/components/pms/ReceiptReviewForm";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import type { OCRExtractedData } from "@/types";

type Step = "upload" | "review";

export default function NewPMSRecordPage() {
  const { data: session, status } = useSession();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>("upload");
  const [scannedData, setScannedData] = useState<OCRExtractedData | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/");
  }

  async function handleUpload(file: File) {
    setScanning(true);
    setScanError(null);
    try {
      const formData = new FormData();
      formData.append("receipt", file);
      const res = await fetch("/api/scan-receipt", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setScanError(json.error ?? "Scan failed — please enter details manually.");
        setScannedData({ items: [], rawText: "" });
      } else {
        setScannedData(json.data ?? { items: [], rawText: "" });
        setImagePath(json.imagePath ?? null);
      }
    } catch {
      setScanError("Network error — please check your connection and try again.");
      setScannedData({ items: [], rawText: "" });
    } finally {
      setScanning(false);
      setStep("review");
    }
  }

  function handleSkipScan() {
    setScannedData({ items: [], rawText: "" });
    setImagePath(null);
    setScanError(null);
    setStep("review");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session?.user?.name} />
      <main className="py-8">
        {step === "upload" ? (
          <ReceiptUploader
            onUpload={handleUpload}
            onSkip={handleSkipScan}
            scanning={scanning}
          />
        ) : (
          <ReceiptReviewForm
            vehicleId={id}
            initialData={scannedData!}
            imagePath={imagePath}
            scanError={scanError}
            onSuccess={() => router.push(`/vehicles/${id}`)}
            onBack={() => { setStep("upload"); setScanError(null); }}
          />
        )}
      </main>
    </div>
  );
}

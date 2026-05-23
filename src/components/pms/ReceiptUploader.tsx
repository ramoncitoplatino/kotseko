"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2 } from "lucide-react";
import Image from "next/image";

interface ReceiptUploaderProps {
  onUpload: (file: File) => void;
  onSkip: () => void;
  scanning: boolean;
}

export default function ReceiptUploader({ onUpload, onSkip, scanning }: ReceiptUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Scan PMS Receipt</h2>
      <p className="text-sm text-gray-500">
        Take a photo or upload an image of your PMS receipt. We'll extract the details automatically.
      </p>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drop zone / preview */}
      <div
        className={`border-2 border-dashed rounded-xl transition-colors ${
          preview ? "border-gray-200" : "border-gray-300 hover:border-blue-400 cursor-pointer"
        } bg-gray-50 overflow-hidden`}
        onClick={() => !preview && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {preview ? (
          <div className="relative">
            <Image
              src={preview}
              alt="Receipt preview"
              width={600}
              height={400}
              className="w-full object-contain max-h-72"
              unoptimized
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
                setSelectedFile(null);
              }}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
            <Upload className="h-10 w-10" />
            <span className="text-sm">Click to upload or drag and drop</span>
            <span className="text-xs">PNG, JPG, HEIC up to 15MB</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={scanning}
        >
          <Camera className="mr-2 h-4 w-4" />
          Take Photo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      {selectedFile && (
        <Button
          className="w-full"
          disabled={scanning}
          onClick={() => onUpload(selectedFile)}
        >
          {scanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning receipt...
            </>
          ) : (
            "Scan & Extract Details"
          )}
        </Button>
      )}

      <button
        type="button"
        className="w-full text-sm text-gray-500 underline hover:text-gray-700"
        onClick={onSkip}
      >
        Skip scanning, enter details manually
      </button>
    </div>
  );
}

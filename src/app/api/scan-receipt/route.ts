import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractReceiptData } from "@/lib/vision";
import { saveFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("receipt") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes as ArrayBuffer) as Buffer;
    let mimeType = file.type || "image/jpeg";

    try {
      const sharp = (await import("sharp")).default;
      buffer = await sharp(buffer)
        .resize({ width: 1500, withoutEnlargement: true })
        .jpeg({ quality: 88 })
        .toBuffer();
      mimeType = "image/jpeg";
    } catch { /* sharp unavailable */ }

    const filename = `receipt_${Date.now()}_${session.user.id.slice(0, 8)}.jpg`;
    const imagePath = await saveFile(buffer, filename, "receipts");

    const extractedData = await extractReceiptData(buffer, mimeType);

    return NextResponse.json({ success: true, data: extractedData, imagePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("scan-receipt error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

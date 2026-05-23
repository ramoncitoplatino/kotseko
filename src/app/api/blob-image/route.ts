import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { get } from "@vercel/blob";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url || !url.includes("blob.vercel-storage.com")) {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  try {
    // Use the SDK's get() — it sends the correct auth headers for private blobs
    const result = await get(url, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!result || !result.stream) {
      return new NextResponse("Image not found", { status: 404 });
    }

    return new NextResponse(result.stream as ReadableStream, {
      headers: {
        "Content-Type": result.blob.contentType || "image/jpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Image not found", { status: 404 });
  }
}

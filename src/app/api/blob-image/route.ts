import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetch as undiciFetch } from "undici";

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

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    console.error("blob-image: BLOB_READ_WRITE_TOKEN is not set");
    return new NextResponse("Server misconfiguration", { status: 500 });
  }

  try {
    // Use undici directly — bypasses Next.js's patched global fetch which can
    // interfere with Vercel Blob private URL authentication
    const upstream = await undiciFetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!upstream.ok) {
      const body = await upstream.text().catch(() => "");
      console.error(`blob-image: upstream ${upstream.status} — ${body}`);
      return new NextResponse("Image not found", { status: upstream.status });
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    const contentType = upstream.headers.get("Content-Type") ?? "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (err) {
    console.error("blob-image: error", err);
    return new NextResponse("Image not found", { status: 404 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const upstream = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!upstream.ok) {
    return new NextResponse("Image not found", { status: upstream.status });
  }

  const contentType = upstream.headers.get("Content-Type") ?? "image/jpeg";
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=86400",
    },
  });
}

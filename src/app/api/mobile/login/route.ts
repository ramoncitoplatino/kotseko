import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Returns a NextAuth-compatible JWT so the mobile app can use it
// as the session cookie — getServerSession works on all existing API routes.
export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const secret = process.env.NEXTAUTH_SECRET!;
  const token = await encode({
    token: { sub: user.id, id: user.id, email: user.email, name: user.name },
    secret,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  const isProduction = process.env.NODE_ENV === "production";
  const cookieName = isProduction
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  return NextResponse.json({
    token,
    cookieName,
    user: { id: user.id, email: user.email, name: user.name },
  });
}

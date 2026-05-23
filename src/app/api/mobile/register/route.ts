import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { name, email, password: hashed } });

  const secret = process.env.NEXTAUTH_SECRET!;
  const token = await encode({
    token: { sub: user.id, id: user.id, email: user.email, name: user.name },
    secret,
    maxAge: 30 * 24 * 60 * 60,
  });

  const isProduction = process.env.NODE_ENV === "production";
  const cookieName = isProduction
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  return NextResponse.json(
    { token, cookieName, user: { id: user.id, email: user.email, name: user.name } },
    { status: 201 }
  );
}

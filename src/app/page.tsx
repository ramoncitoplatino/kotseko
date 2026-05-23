import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  const params = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4 text-4xl">
            🚗
          </div>
          <h1 className="text-3xl font-bold text-white">Kotseko</h1>
          <p className="text-slate-400 mt-1">Vehicle PMS Tracker</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {params.registered && (
            <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
              Account created! Please sign in.
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sign in to your account</h2>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

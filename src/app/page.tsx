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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl mb-4 text-4xl shadow-lg">
            🚗
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Kotseko</h1>
          <p className="text-blue-200 mt-1">Vehicle PMS Tracker</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-blue-950/40 p-8">
          {params.registered && (
            <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm text-center font-medium">
              Account created! Please sign in.
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sign in to your account</h2>
          <LoginForm />
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          Secure vehicle maintenance tracking
        </p>
      </div>
    </main>
  );
}

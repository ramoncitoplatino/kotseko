import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl mb-4 text-4xl shadow-lg">
            🚗
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Kotseko</h1>
          <p className="text-blue-200 mt-1">Create your account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl shadow-blue-950/40 p-8">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}

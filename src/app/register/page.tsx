import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🚗</div>
          <h1 className="text-3xl font-bold text-gray-900">Kotseko</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}

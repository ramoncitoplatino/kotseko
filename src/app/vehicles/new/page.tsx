import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import VehicleForm from "@/components/vehicles/VehicleForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewVehiclePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={session.user.name} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Register New Vehicle</h2>
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <VehicleForm />
        </div>
      </main>
    </div>
  );
}

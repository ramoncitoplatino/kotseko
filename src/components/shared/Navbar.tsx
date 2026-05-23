"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface NavbarProps {
  userName?: string | null;
}

export default function Navbar({ userName }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-gray-900 hover:text-gray-700 transition-colors">
          <span className="text-xl">🚗</span>
          <span className="text-lg">Kotseko</span>
        </Link>

        <div className="flex items-center gap-3">
          {userName && (
            <span className="hidden sm:block text-sm text-gray-500 max-w-[160px] truncate">
              {userName}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

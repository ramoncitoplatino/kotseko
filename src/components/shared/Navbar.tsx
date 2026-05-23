"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface NavbarProps {
  userName?: string | null;
}

export default function Navbar({ userName }: NavbarProps) {
  return (
    <nav className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-lg shrink-0">
            🚗
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Kotseko</span>
        </Link>

        <div className="flex items-center gap-3">
          {userName && (
            <span className="hidden sm:block text-sm text-blue-200 max-w-[160px] truncate">
              {userName}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogIn, UserPlus, LayoutDashboard } from "lucide-react";

interface MobileBottomNavProps {
  isLoggedIn?: boolean;
}

export default function MobileBottomNav({ isLoggedIn = false }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-2xl border-t border-sky-200/70 px-4 py-2.5 shadow-[0_-8px_30px_rgba(56,189,248,0.15)] safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Beranda */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${
            pathname === "/"
              ? "text-sky-600 font-black scale-105 bg-sky-50/80 shadow-xs"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <Home className={`w-5 h-5 ${pathname === "/" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10.5px] tracking-tight">Beranda</span>
        </Link>

        {isLoggedIn ? (
          /* Dashboard jika sudah login */
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${
              pathname?.startsWith("/dashboard")
                ? "text-sky-600 font-black scale-105 bg-sky-50/80 shadow-xs"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${pathname?.startsWith("/dashboard") ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            <span className="text-[10.5px] tracking-tight">Dashboard</span>
          </Link>
        ) : (
          <>
            {/* Daftar */}
            <Link
              href="/register"
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${
                pathname === "/register"
                  ? "text-sky-600 font-black scale-105 bg-sky-50/80 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <UserPlus className={`w-5 h-5 ${pathname === "/register" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[10.5px] tracking-tight">Daftar</span>
            </Link>

            {/* Masuk */}
            <Link
              href="/login"
              className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${
                pathname === "/login"
                  ? "text-sky-600 font-black scale-105 bg-sky-50/80 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <LogIn className={`w-5 h-5 ${pathname === "/login" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[10.5px] tracking-tight">Masuk</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

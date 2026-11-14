import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

import { ArrowRight, LayoutDashboard, CheckCircle2, ShieldCheck, Clock } from "lucide-react";
import InstallPromptBanner from "@/components/InstallPromptBanner";
import Interactive3DBackground from "@/components/Interactive3DBackground";
import MobileBottomNav from "@/components/MobileBottomNav";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-100/60 text-slate-800 flex flex-col font-sans selection:bg-sky-500 selection:text-white overflow-hidden">
      {/* 3D Animated Background */}
      <Interactive3DBackground />

      {/* Navbar */}
      <header className="border-b border-sky-100/80 bg-white/70 backdrop-blur-xl sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-center sm:justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 hover:opacity-90 transition mx-auto sm:mx-0">
            <Image
              src="/logo.jpg"
              alt="Logo Bimbel BUDI BAKTI"
              width={34}
              height={34}
              className="rounded-xl object-cover shadow-md ring-2 ring-sky-200/80 shrink-0"
            />
            <span className="font-extrabold text-sm sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">
              Bimbel BUDI BAKTI
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            {session ? (
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition shadow-lg shadow-sky-500/25 whitespace-nowrap"
              >
                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Buka Dashboard
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 rounded-xl border border-sky-200 bg-white/80 hover:bg-white px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 transition shadow-xs backdrop-blur-md whitespace-nowrap"
                >
                  Daftar
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 sm:gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white transition shadow-lg shadow-sky-500/25 whitespace-nowrap"
                >
                  Masuk <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 flex-1 flex flex-col justify-center items-center z-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Presensi Bimbingan Belajar yang{" "}
            <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-xs">
              Cepat, Rapi, &amp; Akurat
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Sistem pencatatan kehadiran modern berbasis foto selfie kamera langsung, persetujuan realtime, monitoring kelas, dan rekapitulasi data Excel instan.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={session ? "/dashboard" : "/login"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-600 px-8 py-4 text-sm font-extrabold text-white shadow-xl shadow-sky-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {session ? "Masuk ke Dashboard Saya" : "Mulai Gunakan Aplikasi"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 3D Card Highlights */}
          <div id="fitur" className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-5 rounded-2xl bg-white/80 border border-sky-100 shadow-md backdrop-blur-md hover:shadow-lg hover:border-sky-300 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Selfie Anti-Titip Absen</h3>
              <p className="text-xs text-slate-500 mt-1">Hanya kamera langsung perangkat, tanpa upload galeri manipulatif.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 border border-sky-100 shadow-md backdrop-blur-md hover:shadow-lg hover:border-sky-300 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Approval Cepat Realtime</h3>
              <p className="text-xs text-slate-500 mt-1">Notifikasi pop-up otomatis dan verifikasi langsung dari Superadmin.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 border border-sky-100 shadow-md backdrop-blur-md hover:shadow-lg hover:border-sky-300 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Ekspor Excel Profesional</h3>
              <p className="text-xs text-slate-500 mt-1">Rekap data kehadiran dengan tata letak warna Royal Blue rapi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sky-100 py-6 text-center text-xs text-slate-500 relative z-10 backdrop-blur-md bg-white/60 pb-20 sm:pb-6">
        Dibuat oleh{" "}
        <a
          href="https://www.instagram.com/mochalifsurya/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 hover:text-sky-500 font-semibold transition-colors"
        >
          Alif Surya
        </a>
      </footer>

      {/* Mobile Bottom Navigation Bar (Khusus Tampilan Mobile) */}
      <MobileBottomNav isLoggedIn={!!session} />

      {/* Pop-up Pasang Aplikasi (PWA Install Prompt) - HANYA muncul jika pengguna belum login */}
      {!session && <InstallPromptBanner />}
    </div>
  );
}

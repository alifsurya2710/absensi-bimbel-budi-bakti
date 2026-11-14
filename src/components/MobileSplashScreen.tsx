"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function MobileSplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Jalankan hanya di client setelah mount untuk menghindari hydration mismatch
    const checkTimer = setTimeout(() => {
      const isMobile = window.innerWidth < 768;
      const hasShown = sessionStorage.getItem("mobile_splash_shown");

      if (!isMobile || hasShown) return;

      setIsVisible(true);
      sessionStorage.setItem("mobile_splash_shown", "true");
    }, 0);

    // Tampil selama ~3 detik sebelum mulai fade-out (2.5 detik tampil + 0.5 detik fade-out)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);

    // Hapus dari DOM setelah 3 detik penuh
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => {
      clearTimeout(checkTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] md:hidden flex flex-col items-center justify-between p-8 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white transition-opacity duration-500 select-none ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Glow */}
      <div className="absolute top-1/4 w-72 h-72 rounded-full bg-blue-600/25 blur-3xl animate-pulse pointer-events-none" />

      {/* Spacer Atas */}
      <div className="h-4" />

      {/* Bagian Tengah: Logo & Teks Sambutan */}
      <div className="flex flex-col items-center text-center max-w-xs z-10 -mt-10">
        <div className="relative w-28 h-28 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20 mb-6 bg-white p-1">
          <Image
            src="/logo.jpg"
            alt="Logo Bimbel BUDI BAKTI"
            fill
            className="object-cover rounded-2xl"
            priority
          />
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
          Selamat Datang di Absensi Bimbel Budi Bakti
        </h1>

        <p className="text-xs text-indigo-200/80 mt-2.5 font-medium leading-relaxed">
          Sistem Presensi Cepat, Rapi &amp; Akurat Berbasis Kamera Selfie
        </p>
      </div>

      {/* Bagian Bawah: Loading Indicator */}
      <div className="pb-8 flex flex-col items-center gap-2 z-10">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        <span className="text-[11px] font-semibold text-slate-400 tracking-wider">
          Memuat aplikasi...
        </span>
      </div>
    </div>
  );
}

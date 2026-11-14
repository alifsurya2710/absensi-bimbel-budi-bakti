"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Delay kecil untuk menghindari cascading renders dan memastikan hydration selesai
    const timer = setTimeout(() => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.navigator as any).standalone === true;
      
      const dismissed = sessionStorage.getItem("pwa_install_dismissed");
      if (!isStandalone && !dismissed) {
        setVisible(true);
      }

      const userAgent = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setIsIOS(true);
      }
    }, 100);

    // Android / Desktop Chrome PWA prompt listener
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("pwa_install_dismissed", "true");
        }
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert(
        "Untuk memasang di iPhone/iPad:\n1. Tekan tombol Bagikan (Share) di bawah layar Safari\n2. Pilih 'Tambah ke Layar Utama' (Add to Home Screen)"
      );
    } else {
      alert(
        "Untuk memasang di HP Anda:\n1. Tekan tanda titik tiga (⋮) di pojok kanan atas browser\n2. Pilih 'Pasang aplikasi' atau 'Tambahkan ke Layar Utama'"
      );
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pwa_install_dismissed", "true");
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="relative bg-white text-slate-800 rounded-3xl p-5 shadow-2xl border border-slate-100/80">
        {/* Tombol Tutup X */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-1"
          aria-label="Tutup banner"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Konten Atas: Logo + Teks */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-md ring-2 ring-indigo-50 bg-indigo-500">
            <Image
              src="/logo.jpg"
              alt="Logo Bimbel BUDI BAKTI"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-snug">
              Pasang Bimbel BUDI BAKTI di HP Anda seperti aplikasi biasa?
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Buka lebih cepat dari layar utama, tanpa repot buka browser.
            </p>
          </div>
        </div>

        {/* Tombol Aksi Bawah */}
        <div className="flex items-center gap-3 mt-4 pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Nanti
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white text-xs font-bold transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            Pasang
          </button>
        </div>
      </div>
    </div>
  );
}

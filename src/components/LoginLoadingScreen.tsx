"use client";

import Image from "next/image";

interface FullscreenLoaderProps {
  visible: boolean;
  mode?: "login" | "logout";
}

export default function FullscreenLoader({ visible, mode = "login" }: FullscreenLoaderProps) {
  if (!visible) return null;

  const isLogout = mode === "logout";

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center text-white animate-in fade-in duration-300 ${
        isLogout
          ? "bg-gradient-to-br from-slate-950 via-rose-950 to-slate-950"
          : "bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950"
      }`}
      aria-label={isLogout ? "Keluar dari akun..." : "Memuat dashboard..."}
      role="status"
    >
      {/* Background glow */}
      <div className={`absolute top-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse pointer-events-none ${isLogout ? "bg-rose-500/20" : "bg-emerald-500/20"}`} />
      <div className={`absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl animate-pulse pointer-events-none ${isLogout ? "bg-orange-500/15" : "bg-teal-500/15"}`} />

      {/* Logo */}
      <div className="relative w-24 h-24 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20 mb-8 bg-white p-1 z-10">
        <Image
          src="/logo-forsiremis.png"
          alt="Logo FORSIREMIS"
          fill
          className="object-cover rounded-2xl"
          priority
        />
      </div>

      {/* Judul */}
      <h1 className="text-xl font-black tracking-tight text-white mb-1 z-10">
        FORSIREMIS
      </h1>
      <p className={`text-xs font-medium mb-10 z-10 ${isLogout ? "text-rose-300" : "text-emerald-300"}`}>
        {isLogout ? "Sedang keluar dari akun Anda..." : "Menyiapkan dashboard Anda..."}
      </p>

      {/* Animasi loader */}
      <div className="loader z-10">
        <div className="circle" style={{ "--color": isLogout ? "#f43f5e" : "#10b981" } as React.CSSProperties} />
        <div className="circle" style={{ "--color": isLogout ? "#fb7185" : "#34d399" } as React.CSSProperties} />
        <div className="circle" style={{ "--color": isLogout ? "#fda4af" : "#6ee7b7" } as React.CSSProperties} />
        <div className="circle" style={{ "--color": isLogout ? "#fecdd3" : "#a7f3d0" } as React.CSSProperties} />
      </div>

      {/* Teks bawah */}
      <p className="mt-10 text-[11px] font-semibold text-slate-400 tracking-wider uppercase z-10">
        {isLogout ? "Sampai jumpa kembali..." : "Mohon tunggu sebentar..."}
      </p>

      <style jsx>{`
        .loader {
          --dim: 3rem;
          width: var(--dim);
          height: var(--dim);
          position: relative;
          animation: spin988 2s linear infinite;
        }

        .loader .circle {
          --dim: 1.2rem;
          width: var(--dim);
          height: var(--dim);
          background-color: var(--color);
          border-radius: 50%;
          position: absolute;
        }

        .loader .circle:nth-child(1) { top: 0; left: 0; }
        .loader .circle:nth-child(2) { top: 0; right: 0; }
        .loader .circle:nth-child(3) { bottom: 0; left: 0; }
        .loader .circle:nth-child(4) { bottom: 0; right: 0; }

        @keyframes spin988 {
          0%        { transform: scale(1) rotate(0); }
          20%, 25%  { transform: scale(1.3) rotate(90deg); }
          45%, 50%  { transform: scale(1) rotate(180deg); }
          70%, 75%  { transform: scale(1.3) rotate(270deg); }
          95%, 100% { transform: scale(1) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Named export aliases agar import lama tetap kompatibel
export { FullscreenLoader as LoginLoadingScreen };

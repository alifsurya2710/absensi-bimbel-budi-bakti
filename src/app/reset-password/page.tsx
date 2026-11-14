"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Interactive3DBackground from "@/components/Interactive3DBackground";
import {
  Lock,
  Loader2,
  AlertCircle,
  Check,
  X,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Kriteria password
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[@$!%*?&]/.test(newPassword);
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token verifikasi tidak ditemukan dalam tautan.");
      return;
    }

    if (!isPasswordValid) {
      setError("Kata sandi belum memenuhi seluruh kriteria keamanan.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal memperbarui kata sandi.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm border border-rose-200">
          Tautan reset kata sandi tidak valid atau telah kedaluwarsa.
        </div>
        <Link
          href="/forgot-password"
          className="inline-block text-xs font-semibold text-indigo-600 hover:underline"
        >
          Ajukan permintaan baru
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-3 text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-3 text-sm text-emerald-700">
          <Check className="w-5 h-5 shrink-0 text-emerald-500" />
          <span>Kata sandi berhasil diperbarui! Mengalihkan ke halaman masuk...</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Kata Sandi Baru
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type={showPassword ? "text" : "password"}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
            placeholder="Minimal 8 karakter unik..."
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Syarat Kata Sandi */}
        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
          <p className="font-semibold text-slate-600">Ketentuan Kata Sandi:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
            <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
              {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5" />}
              <span>Minimal 8 karakter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
              {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5" />}
              <span>Huruf besar (A-Z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLowercase ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
              {hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5" />}
              <span>Huruf kecil (a-z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
              {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5" />}
              <span>Angka (0-9)</span>
            </div>
            <div className={`flex items-center gap-1.5 sm:col-span-2 ${hasSymbol ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
              {hasSymbol ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5" />}
              <span>Simbol (@$!%*?&)</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Konfirmasi Kata Sandi Baru
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
            placeholder="Ulangi kata sandi baru..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !isPasswordValid || newPassword !== confirmPassword}
        className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Menyimpan...</span>
          </>
        ) : (
          <>
            <span>Perbarui Kata Sandi</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen bg-slate-950 font-sans p-4 sm:p-6 md:p-12 items-center justify-center overflow-hidden">
      {/* 3D Background */}
      <Interactive3DBackground />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 border border-white/80 ring-1 ring-slate-900/5 relative z-10">
        <Link href="/" className="flex items-center gap-3 mb-6 hover:opacity-85 transition">
          <Image
            src="/logo.jpg"
            alt="Logo Bimbel BUDI BAKTI"
            width={40}
            height={40}
            className="rounded-xl object-cover shadow-sm shrink-0"
          />
          <div>
            <h1 className="text-base sm:text-xl font-bold text-slate-800 leading-tight">Buat Kata Sandi Baru</h1>
            <p className="text-xs text-slate-400">Absensi Bimbel BUDI BAKTI</p>
          </div>
        </Link>

        <Suspense fallback={<div className="text-center py-6 text-xs text-slate-400">Memuat formulir...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-6 text-center text-xs">
          <Link href="/login" className="font-semibold text-slate-500 hover:text-slate-800">
            ← Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}


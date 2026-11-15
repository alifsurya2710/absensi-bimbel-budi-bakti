"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Interactive3DBackground from "@/components/Interactive3DBackground";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step 1: Input Email, Step 2: Input OTP & Password Baru
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status & Timers
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const canResend = countdown === 0;

  // Input refs for 6 digits
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown untuk kirim ulang kode
  useEffect(() => {
    if (step !== 2 || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, countdown]);

  // Kriteria password (persis seperti tema sistem sebelumnya)
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[@$!%*?&]/.test(newPassword);
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  // Handle kirim email OTP (Step 1)
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError("Silakan masukkan alamat Gmail Anda.");
      return;
    }

    setLoading(true);
    setError("");
    setPreviewUrl(null);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal mengirimkan kode OTP.");
      } else {
        setStep(2);
        setCountdown(60);
        if (data.previewUrl) setPreviewUrl(data.previewUrl);
        setTimeout(() => inputRefs.current[0]?.focus(), 150);
      }
    } catch {
      setError("Terjadi kendala koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  // Handle perubahan pada 6 digit OTP box
  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const digits = pasteData.split("");
    setOtp(digits);
    inputRefs.current[5]?.focus();
  };

  // Handle Submit Atur Ulang Kata Sandi (Step 2)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");

    if (fullOtp.length !== 6) {
      setError("Silakan masukkan 6 digit kode OTP lengkap.");
      return;
    }

    if (!isPasswordValid) {
      setError("Kata sandi belum memenuhi semua kriteria keamanan.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: fullOtp,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal mengatur ulang kata sandi.");
      } else {
        setSuccess(data.message || "Kata sandi Anda berhasil diperbarui!");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch {
      setError("Terjadi kendala koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-100/60 font-sans p-4 sm:p-6 md:p-12 items-center justify-center overflow-hidden">
      <Interactive3DBackground />

      <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(16,185,129,0.18)] p-6 sm:p-8 md:p-10 border border-emerald-100/90 ring-1 ring-emerald-200/50 relative z-10">
        
        {/* Header Sesuai Desain Asli (Logo Bimbel + Judul) */}
        <Link href="/" className="flex items-center gap-3 mb-6 hover:opacity-85 transition">
          <Image
            src="/logo-forsiremis.png"
            alt="Logo FORSIREMIS"
            width={40}
            height={40}
            className="rounded-xl object-cover shadow-sm shrink-0"
          />
          <div>
            <h1 className="text-base sm:text-xl font-bold text-slate-800 leading-tight">
              {step === 1 ? "Lupa Kata Sandi" : "Verifikasi Kode OTP"}
            </h1>
            <p className="text-xs text-slate-400">FORSIREMIS</p>
          </div>
        </Link>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          {step === 1 ? (
            "Masukkan alamat Gmail atau email akun Anda. Kami akan mengirimkan kode 6 digit OTP resmi untuk mengatur ulang kata sandi."
          ) : (
            <span>
              Kode 6 digit telah dikirimkan ke <strong className="text-emerald-600 font-bold">{email}</strong>. Silakan masukkan kode dan kata sandi baru Anda.
            </span>
          )}
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-3 text-sm text-rose-700 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-3 text-sm text-emerald-700 animate-in fade-in">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" />
            <span>{success} Mengalihkan ke halaman masuk...</span>
          </div>
        )}

        {/* STEP 1: FORM INPUT GMAIL (Desain Asli dengan Tombol Biru Indigo) */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Gmail / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="contoh@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Kode OTP...</span>
                </>
              ) : (
                <>
                  <span>Kirim Kode OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                ← Kembali ke Halaman Masuk
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: FORM OTP & RESET PASSWORD (Desain Konsisten Biru Indigo & Slate) */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Input 6 Kotak Digit OTP */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Kode Verifikasi (OTP)
                </label>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>6 Digit</span>
                </div>
              </div>

              <div className="flex justify-between gap-1.5 sm:gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-black bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition shadow-2xs"
                  />
                ))}
              </div>

              {/* Countdown & Kirim Ulang */}
              <div className="mt-2 text-center">
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-800 hover:underline transition"
                  >
                    Kirim ulang kode OTP
                  </button>
                ) : (
                  <p className="text-xs text-slate-400">
                    Kirim ulang dalam <span className="font-bold text-slate-600">{countdown} detik</span>
                  </p>
                )}
              </div>
            </div>

            {/* Kotak Petunjuk / Tips */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed space-y-1">
              <p className="font-bold">Tidak menerima email? Pastikan:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-amber-800 pl-0.5">
                <li>Email yang Anda masukkan sudah terdaftar sebagai akun.</li>
                <li>Cek folder Spam / Promosi di Gmail Anda.</li>
                <li>Tunggu hingga 1 menit, lalu klik &quot;Kirim ulang kode&quot;.</li>
              </ol>
              {previewUrl && (
                <div className="pt-1 mt-1 border-t border-amber-200">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-600 underline"
                  >
                    [Simulator] Buka Kotak Masuk Gmail Simulator ↗
                  </a>
                </div>
              )}
            </div>

            {/* Input Kata Sandi Baru */}
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
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                  placeholder="Buat kata sandi baru..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Ketentuan Kata Sandi (Sama persis dengan desain sebelumnya) */}
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

            {/* Konfirmasi Kata Sandi */}
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                  placeholder="Ulangi kata sandi baru..."
                />
              </div>
            </div>

            {/* Tombol Simpan Sandi Baru */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid || newPassword !== confirmPassword || otp.join("").length !== 6}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memperbarui Kata Sandi...</span>
                </>
              ) : (
                <>
                  <span>Atur Ulang Kata Sandi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                ← Ganti Alamat Email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}




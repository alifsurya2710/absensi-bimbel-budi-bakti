"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Lock,
  User,
  Loader2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Interactive3DBackground from "@/components/Interactive3DBackground";
import MathCaptcha from "@/components/MathCaptcha";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Captcha Matematika
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);

  // Rate Limiting (Kunci form 2 menit jika salah > 3 kali)
  const [failedAttempts, setFailedAttempts] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("login_failed_attempts");
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  const [lockoutRemaining, setLockoutRemaining] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("login_lockout_until");
    if (!saved) return 0;
    const lockUntil = parseInt(saved, 10);
    const now = Date.now();
    return lockUntil > now ? Math.ceil((lockUntil - now) / 1000) : 0;
  });

  // Timer countdown lockout
  useEffect(() => {
    if (lockoutRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          localStorage.removeItem("login_lockout_until");
          localStorage.removeItem("login_failed_attempts");
          setFailedAttempts(0);
          setError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Cek apakah masih dalam masa lockout
    if (lockoutRemaining > 0) {
      setError(`Terlalu banyak percobaan gagal. Silakan tunggu ${lockoutRemaining} detik.`);
      return;
    }

    // Cek Captcha
    if (!isCaptchaValid) {
      setError("Jawaban captcha matematika salah. Silakan coba lagi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (res?.error) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        localStorage.setItem("login_failed_attempts", nextAttempts.toString());

        // Jika salah > 3 kali (yakni ke-4 dst, atau mencapai 4 kali), kunci selama 2 menit (120 detik)
        if (nextAttempts > 3) {
          const lockDuration = 120; // 2 Menit
          const lockUntil = Date.now() + lockDuration * 1000;
          localStorage.setItem("login_lockout_until", lockUntil.toString());
          setLockoutRemaining(lockDuration);

          // Reset/kosongkan isi formulir sesuai permintaan user
          setIdentifier("");
          setPassword("");
          setCaptchaAnswer("");
          setIsCaptchaValid(false);

          setError(
            "Anda telah salah memasukkan data lebih dari 3 kali. Akun sementara dikunci selama 2 menit untuk keamanan."
          );
        } else {
          // Bersihkan password dan captcha saja agar user mengisi ulang
          setPassword("");
          setCaptchaAnswer("");
          setIsCaptchaValid(false);

          const sisaKesempatan = 4 - nextAttempts;
          setError(
            `Username / Email atau kata sandi tidak sesuai. (Sisa ${sisaKesempatan} kesempatan sebelum dikunci 2 menit)`
          );
        }
      } else {
        // Login berhasil: bersihkan status lockout & attempts
        localStorage.removeItem("login_lockout_until");
        localStorage.removeItem("login_failed_attempts");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Terjadi kendala koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  const isLocked = lockoutRemaining > 0;
  const minutes = Math.floor(lockoutRemaining / 60);
  const seconds = lockoutRemaining % 60;
  const formattedCountdown = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="relative flex min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-green-50/60 font-sans overflow-hidden">
      {/* 3D Background */}
      <Interactive3DBackground />

      {/* Left decoration area (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-slate-800 relative z-10">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-85 transition"
        >
          <Image
            src="/logo-forsiremis.png"
            alt="Logo FORSIREMIS"
            width={44}
            height={44}
            className="rounded-2xl object-cover shadow-md ring-2 ring-emerald-300"
          />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">FORSIREMIS</h1>
            <p className="text-xs text-emerald-600 font-semibold">Bimbingan Latihan Persiapan Menuju PTN</p>
          </div>
        </Link>

        {/* 3D Card Display */}
        <div className="space-y-6 max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight text-slate-900">
            Presensi FORSIREMIS Kini Lebih{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
              Praktis, Cepat, &amp; Akurat.
            </span>
          </h2>

          <div className="space-y-3 pt-2 text-sm text-slate-600 font-medium">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Verifikasi wajah langsung lewat kamera selfie real-time</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Proteksi ganda dengan Captcha Matematika &amp; Anti Brute Force</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Pemisahan akses aman untuk Superadmin, Admin, Guru, &amp; Murid</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          © {new Date().getFullYear()} FORSIREMIS. Hak Cipta Dilindungi.
        </div>
      </div>

      {/* Right form area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 relative z-10">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(16,185,129,0.16)] p-6 sm:p-10 border border-emerald-100/90 ring-1 ring-emerald-200/50">
          {/* Mobile Top Logo Brand */}
          <div className="lg:hidden flex items-center justify-center mb-6 pb-4 border-b border-slate-100">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 hover:opacity-85 transition"
              title="Kembali ke Beranda"
            >
              <Image
                src="/logo-forsiremis.png"
                alt="Logo FORSIREMIS"
                width={38}
                height={38}
                className="rounded-xl object-cover shadow-sm ring-1 ring-slate-200"
              />
              <span className="font-extrabold text-slate-800 text-sm">FORSIREMIS</span>
            </Link>
          </div>

          <div className="mb-6 sm:mb-8 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Masuk ke Portal</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Gunakan Username atau Email terdaftar Anda.
            </p>
          </div>

          {/* Banner Peringatan Kunci Waktu 2 Menit */}
          {isLocked && (
            <div className="mb-6 rounded-2xl bg-rose-500 text-white p-4 flex items-center gap-3 shadow-lg shadow-rose-500/25 animate-in fade-in">
              <Clock className="w-6 h-6 shrink-0 animate-pulse text-rose-200" />
              <div className="text-xs">
                <p className="font-extrabold text-sm">Formulir Terkunci Sementara</p>
                <p className="text-rose-100 mt-0.5">
                  Anda salah lebih dari 3 kali. Silakan tunggu{" "}
                  <strong className="text-white text-sm underline">{formattedCountdown}</strong> sebelum mencoba lagi.
                </p>
              </div>
            </div>
          )}

          {error && !isLocked && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-3 text-sm text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username atau Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  disabled={isLocked}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="username atau email..."
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Kata Sandi
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Lupa Kata Sandi?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLocked}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Captcha Matematika */}
            <MathCaptcha
              disabled={isLocked}
              value={captchaAnswer}
              onChange={setCaptchaAnswer}
              onValidate={setIsCaptchaValid}
            />

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memeriksa Akun...</span>
                </>
              ) : isLocked ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Terkunci ({formattedCountdown})</span>
                </>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link ke Register */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Belum memiliki akun?{" "}
            <Link
              href="/register"
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Daftar Murid / Guru di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}




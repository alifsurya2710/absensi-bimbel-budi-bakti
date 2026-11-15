"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Lock,
  Mail,
  User,
  AtSign,
  Phone,
  Camera,
  Loader2,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  UserCheck,
  Check,
  X,
  BookOpen,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import Interactive3DBackground from "@/components/Interactive3DBackground";
import MathCaptcha from "@/components/MathCaptcha";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"MURID" | "GURU">("MURID");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [kelas, setKelas] = useState("XII RPL 1");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Captcha Matematika
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);

  // Kriteria password realtime
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[@$!%*?&]/.test(password);
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  // Handle upload foto profil opsional
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran foto maksimal 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isCaptchaValid) {
      setError("Jawaban captcha matematika belum benar. Silakan periksa kembali.");
      return;
    }

    if (!isPasswordValid) {
      setError("Pastikan kata sandi telah memenuhi semua kriteria keamanan.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          email,
          phone,
          password,
          role,
          kelas: role === "MURID" ? kelas : null,
          image: imagePreview,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal melakukan pendaftaran.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 1800);
      }
    } catch {
      setError("Terjadi gangguan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-100/60 font-sans p-4 sm:p-6 md:p-12 items-start sm:items-center justify-center overflow-hidden">
      {/* 3D Background */}
      <Interactive3DBackground />

      <div className="w-full max-w-xl bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(16,185,129,0.18)] p-5 sm:p-8 md:p-10 border border-emerald-100/90 ring-1 ring-emerald-200/50 my-4 sm:my-0 relative z-10">
        {/* Brand */}
        <div className="mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition shrink-0">
              <Image
                src="/logo-forsiremis.png"
                alt="Logo FORSIREMIS"
                width={36}
                height={36}
                className="rounded-xl object-cover shadow-sm shrink-0"
              />
              <div>
                <h1 className="text-xs sm:text-lg font-bold text-slate-800 leading-tight whitespace-nowrap">FORSIREMIS</h1>
                <p className="text-[10px] sm:text-xs text-slate-400 leading-tight">Registrasi Akun Baru</p>
              </div>
            </Link>
            <Link
              href="/login"
              className="shrink-0 text-[11px] sm:text-xs font-semibold text-emerald-600 hover:text-emerald-700 whitespace-nowrap transition"
            >
              Sudah punya akun? Masuk
            </Link>
          </div>
        </div>

        {/* Tab Role Switcher */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Daftar Sebagai:
          </label>
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRole("MURID")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                role === "MURID"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Siswa (Murid)
            </button>
            <button
              type="button"
              onClick={() => setRole("GURU")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                role === "GURU"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-4 h-4" /> Guru Pendidik
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-3 text-sm text-rose-700">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-3 text-sm text-emerald-700">
            <Check className="w-5 h-5 shrink-0 text-emerald-500" />
            <span>Pendaftaran berhasil! Mengalihkan ke halaman login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Foto Profil (Opsional) */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="relative">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Preview Profil"
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 border border-slate-300">
                  <Camera className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700">
                Foto Profil <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <p className="text-[11px] text-slate-400 mb-2">Format JPG/PNG, maksimal 2MB.</p>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  id="profile-upload"
                />
                <label
                  htmlFor="profile-upload"
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                >
                  <Camera className="w-3.5 h-3.5" /> Pilih Foto
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-medium transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                placeholder={role === "MURID" ? "Contoh: Budi Pratama" : "Contoh: Ahmad Fauzi, S.Pd"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                  placeholder="budi_pratama"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                  placeholder="budi@example.com"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nomor Telepon (Pengganti NIS / NIP) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor Telepon
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                  placeholder="081234567890"
                />
              </div>
            </div>

            {/* Kelas (Khusus Siswa) */}
            {role === "MURID" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kelas
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                    placeholder="XII RPL 1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Password dengan tombol lihat mata */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                placeholder="Minimal 8 karakter unik..."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Syarat Keamanan Password */}
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

          {/* Captcha Matematika */}
          <MathCaptcha
            disabled={loading}
            value={captchaAnswer}
            onChange={setCaptchaAnswer}
            onValidate={setIsCaptchaValid}
          />

          <button
            type="submit"
            disabled={loading || !isPasswordValid || !isCaptchaValid}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuat Akun...</span>
              </>
            ) : (
              <>
                <span>Daftar Akun Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}




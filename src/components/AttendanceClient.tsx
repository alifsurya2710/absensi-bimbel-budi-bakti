"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import {
  Camera,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  AlertCircle,
  Trash2,
  History,
  XCircle,
  Clock3,
  AlertTriangle,
  RotateCcw,
  UserCheck2,
  FileText,
  Thermometer,
  ChevronLeft,
  ChevronRight,
  Users2,
} from "lucide-react";
import EditProfileModal from "@/components/EditProfileModal";
import Interactive3DBackground from "@/components/Interactive3DBackground";
import ParentAttendanceForm from "@/components/ParentAttendanceForm";

interface AttendanceRecord {
  id: string;
  status: "HADIR" | "BELUM_HADIR" | "IZIN" | "SAKIT" | "TIDAK_HADIR";
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  notes?: string | null;
  photo?: string | null;
  createdAt: string;
}

interface ParentAttendanceRecord {
  id: string;
  parentName: string;
  parentPhone: string;
  status: "HADIR" | "BELUM_HADIR" | "IZIN" | "SAKIT" | "TIDAK_HADIR";
  notes?: string | null;
  createdAt: string;
}

interface AttendancePageProps {
  user: {
    id: string;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    role: "GURU" | "MURID";
    kelas?: string | null;
    phone?: string | null;
    image?: string | null;
  };
  initialHistory: AttendanceRecord[];
  initialParentHistory?: ParentAttendanceRecord[];
}

export default function AttendanceClient({
  user: initialUser,
  initialHistory,
  initialParentHistory = [],
}: AttendancePageProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [status, setStatus] = useState<"HADIR" | "BELUM_HADIR" | "IZIN" | "SAKIT" | "TIDAK_HADIR">("HADIR");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState<AttendanceRecord[]>(initialHistory);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [dismissedPopupIds, setDismissedPopupIds] = useState<Set<string>>(() => new Set());

  // Kontrol tampilan mobile: "home" = form presensi, "riwayat" = halaman riwayat penuh, "orangtua" = form absensi orang tua (khusus murid)
  const [mobileView, setMobileView] = useState<"home" | "riwayat" | "orangtua">("home");
  const [mobileShowCamera, setMobileShowCamera] = useState(false);
  const [activePopup, setActivePopup] = useState<AttendanceRecord | null>(() => {
    if (initialHistory && initialHistory.length > 0) {
      const latest = initialHistory[0];
      if (latest.approvalStatus === "PENDING" || latest.approvalStatus === "REJECTED") {
        return latest;
      }
    }
    return null;
  });

  // Polling cek status presensi realtime (jika admin baru saja mereject, popup langsung muncul di layar)
  useEffect(() => {
    const checkLatestStatus = async () => {
      try {
        const res = await fetch("/api/attendance/user-status");
        if (!res.ok) return;
        const data = await res.json();
        if (data.latest) {
          const remoteLatest: AttendanceRecord = data.latest;
          if (remoteLatest.approvalStatus === "REJECTED") {
            // Jangan munculkan lagi jika ID presensi ini sudah ditutup oleh user
            if (dismissedPopupIds.has(remoteLatest.id)) {
              return;
            }
            setActivePopup((current) => {
              if (!current || current.id !== remoteLatest.id || current.approvalStatus !== "REJECTED") {
                return remoteLatest;
              }
              return current;
            });
          }
        }
      } catch (err) {
        console.error("Gagal polling status user:", err);
      }
    };

    const interval = setInterval(checkLatestStatus, 6000);
    return () => clearInterval(interval);
  }, [dismissedPopupIds]);

  // Kamera Langsung (Webcam)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isPhotoRequired = status === "HADIR" || status === "IZIN" || status === "SAKIT";

  const statusOptions = [
    { value: "HADIR", label: "Hadir", icon: CheckCircle2, iconClass: "text-emerald-500", desc: "Wajib Foto Selfie" },
    { value: "BELUM_HADIR", label: "Belum Hadir", icon: Clock, iconClass: "text-amber-500", desc: "Menunggu Jadwal" },
    { value: "IZIN", label: "Izin", icon: FileText, iconClass: "text-blue-500", desc: "Wajib Bukti / Foto" },
    { value: "SAKIT", label: "Sakit", icon: Thermometer, iconClass: "text-purple-500", desc: "Wajib Bukti / Foto" },
    { value: "TIDAK_HADIR", label: "Tidak Hadir", icon: XCircle, iconClass: "text-rose-500", desc: "Alpa / Terkendala" },
  ];

  // Aktifkan Kamera Langsung
  const startCamera = async () => {
    setIsCameraActive(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Gagal mengakses kamera perangkat. Pastikan izin kamera telah diberikan di browser Anda.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const takeSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setPhoto(dataUrl);
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isPhotoRequired && !photo) {
      setError(`Untuk status '${status}', Anda wajib menyertakan foto/selfie.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes,
          photo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menyimpan presensi.");
      } else {
        setSuccess("Presensi berhasil dicatat!");
        setPhoto(null);
        setNotes("");
        setHistory([data.attendance, ...history]);
        router.refresh();
      }
    } catch {
      setError("Terjadi kendala koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-100/60 text-slate-800 font-sans pb-20 sm:pb-16 overflow-hidden">
      {/* 3D Animated Background */}
      <Interactive3DBackground />

      {/* Top Navbar */}
      <header className="bg-white/75 backdrop-blur-xl border-b border-emerald-100/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Image
              src="/logo-forsiremis.png"
              alt="Logo FORSIREMIS"
              width={38}
              height={38}
              className="rounded-xl object-cover shadow-sm ring-2 ring-emerald-200 shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-extrabold text-slate-900 leading-tight whitespace-nowrap">FORSIREMIS</h1>
              <p className="text-[10px] sm:text-xs text-emerald-600 font-semibold truncate">
                Portal Presensi {currentUser.role === "GURU" ? "Guru Pendidik" : "Siswa (Murid)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-xs font-semibold text-slate-700 transition shadow-xs"
            >
              <UserCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Edit Profil</span>
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-600 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6 relative z-10">
        {/* ===== MOBILE: Halaman Riwayat Presensi (full screen, hanya di mobile) ===== */}
        {/* Tampil di mobile saat mobileView === "riwayat", selalu tersembunyi di desktop */}
        <div className={`sm:hidden ${mobileView === "riwayat" ? "block" : "hidden"}`}>
          {/* Back Header */}
          <div className="flex items-center gap-3 mb-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-emerald-100 shadow-xs">
            <button
              type="button"
              onClick={() => setMobileView("home")}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 text-slate-700 border border-emerald-200 transition"
              aria-label="Kembali"
            >
              <ChevronLeft className="w-5 h-5 text-emerald-700" />
            </button>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">Riwayat Presensi Saya</h2>
              <p className="text-[10px] text-slate-500">Daftar kehadiran yang baru Anda ajukan</p>
            </div>
            <span className="ml-auto text-xs text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              {history.length} Catatan
            </span>
          </div>

          {/* Riwayat Table (mobile cards) */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-100 shadow-xl overflow-hidden text-slate-800">
            {history.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-400 italic text-sm">
                Belum ada data kehadiran yang tercatat.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {history
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((item) => (
                    <div key={item.id} className="px-5 py-4 flex flex-col gap-2">
                      {/* Tanggal & Waktu */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-xs">
                          {new Date(item.createdAt).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {/* Status badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            item.status === "HADIR"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "BELUM_HADIR"
                              ? "bg-amber-100 text-amber-700"
                              : item.status === "IZIN"
                              ? "bg-blue-100 text-blue-700"
                              : item.status === "SAKIT"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                        {item.approvalStatus === "APPROVED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Disetujui
                          </span>
                        ) : item.approvalStatus === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" /> Ditolak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock3 className="w-3 h-3" /> Menunggu Review
                          </span>
                        )}
                        {item.photo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.photo}
                            alt="Bukti"
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shadow-sm"
                          />
                        )}
                      </div>
                      {/* Keterangan */}
                      {(item.notes || item.rejectionReason) && (
                        <div className="text-[11px] text-slate-500">
                          {item.notes && <span>{item.notes}</span>}
                          {item.rejectionReason && (
                            <span className="block text-rose-600 font-medium mt-0.5">
                              Alasan: {item.rejectionReason}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Pagination mobile riwayat */}
            {history.length > itemsPerPage && (
              <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-2 bg-slate-50/50">
                <p className="text-[11px] text-slate-500">
                  <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span>
                  {" – "}
                  <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, history.length)}</span>
                  {" / "}
                  <span className="font-bold text-slate-700">{history.length}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition"
                    aria-label="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.ceil(history.length / itemsPerPage) }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCurrentPage(num)}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition flex items-center justify-center ${
                        num === currentPage
                          ? "bg-emerald-600 text-white shadow-md"
                          : "text-slate-600 hover:bg-slate-200/60"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage === Math.ceil(history.length / itemsPerPage)}
                    onClick={() => setCurrentPage((p) => Math.min(Math.ceil(history.length / itemsPerPage), p + 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition"
                    aria-label="Halaman Selanjutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== MOBILE: Halaman Absensi Orang Tua (khusus role MURID, tampil jika mobileView === 'orangtua') ===== */}
        {currentUser.role === "MURID" && (
          <div className={`sm:hidden ${mobileView === "orangtua" ? "block" : "hidden"}`}>
            <div className="flex items-center gap-3 mb-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-emerald-100 shadow-xs">
              <button
                type="button"
                onClick={() => setMobileView("home")}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 text-slate-700 border border-emerald-200 transition"
                aria-label="Kembali ke Presensi Siswa"
              >
                <ChevronLeft className="w-5 h-5 text-emerald-700" />
              </button>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 leading-tight">Absensi Orang Tua / Wali</h2>
                <p className="text-[10px] text-slate-500">Khusus saat orang tua berkunjung ke bimbel</p>
              </div>
            </div>

            <ParentAttendanceForm
              studentName={currentUser.name}
              initialHistory={initialParentHistory}
            />
          </div>
        )}

        {/* ===== HOME VIEW: User Info + Form Presensi (mobile: hanya tampil saat mobileView === "home", desktop: selalu tampil) ===== */}
        <div className={`${mobileView === "home" ? "block" : "hidden sm:block"}`}>
        {/* User Info Greeting */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 p-6 sm:p-7 text-white shadow-xl shadow-emerald-600/20 border border-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {currentUser.image ? (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-4 ring-white/30 shadow-lg">
                  <Image
                    src={currentUser.image}
                    alt={currentUser.name || "Foto Profil"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 ring-4 ring-white/30 flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl shadow-lg backdrop-blur-md">
                  {(currentUser.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black leading-tight tracking-tight text-white">
                Selamat Datang, {currentUser.name}!
              </h2>
              <p className="text-xs text-emerald-100 mt-1 font-medium">
                @{currentUser.username || "-"} • {currentUser.email || "Tanpa email"}
              </p>
              <p className="text-xs text-emerald-200 mt-0.5">
                {currentUser.kelas ? `Kelas: ${currentUser.kelas} • ` : ""}No. HP: {currentUser.phone || "-"}
              </p>
            </div>
          </div>
          <div className="text-right sm:border-l sm:border-white/20 sm:pl-6 text-xs text-emerald-100 shrink-0 flex flex-col items-start sm:items-end justify-center">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="hidden sm:inline-flex mb-2 sm:mb-3 items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md border border-white/30 transition shadow-xs"
            >
              <UserCheck2 className="w-3.5 h-3.5 text-amber-300" /> Edit Profil Saya
            </button>
            <p className="font-semibold text-white">Hari Ini:</p>
            <p className="text-emerald-100">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Form Presensi */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-emerald-100/90 p-6 sm:p-8 shadow-[0_15px_40px_rgba(16,185,129,0.12)] text-slate-800">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Isi Kehadiran Hari Ini</h3>
            <p className="text-xs text-slate-500 mt-1">
              Pilih salah satu status kehadiran. Khusus status <strong>Hadir, Izin, atau Sakit</strong> wajib menyertakan foto/selfie langsung.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-3 text-sm text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-3 text-sm text-emerald-700">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status Radio Buttons */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Pilih Status Kehadiran:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {statusOptions.map((opt) => {
                  const isSelected = status === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => {
                        setStatus(opt.value as "HADIR" | "BELUM_HADIR" | "IZIN" | "SAKIT" | "TIDAK_HADIR");
                        setError("");
                      }}
                      className={`flex flex-col items-center text-center p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/80 shadow-md scale-[1.02] ring-2 ring-emerald-500/20"
                          : "border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/60"
                      }`}
                    >
                      <opt.icon className={`w-5 h-5 mb-2 ${opt.iconClass}`} />
                      <span className="font-extrabold text-xs text-slate-900">{opt.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kamera / Selfie (Untuk Hadir, Izin, Sakit) */}
            {isPhotoRequired && (
              <div className="space-y-3">
                {/* Di Mobile: Jika belum diklik di navbar bawah, tampilkan petunjuk instruksi */}
                <div className={`sm:hidden ${mobileShowCamera ? "hidden" : "block"}`}>
                  <div className="p-4 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 flex flex-col items-center justify-center text-center gap-2 text-emerald-950">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md animate-bounce">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold">Foto Bukti / Selfie Kehadiran *Wajib</p>
                      <p className="text-[11px] text-emerald-700/80 mt-0.5">
                        Klik fitur <strong className="text-emerald-700">Selfie</strong> di navigation bawah untuk mengambil foto langsung.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Kontainer Kamera (Selalu tampil di desktop, di mobile hanya tampil jika mobileShowCamera aktif) */}
                <div
                  id="kamera-selfie"
                  className={`p-5 rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-slate-50/50 space-y-3 scroll-mt-24 ${
                    mobileShowCamera ? "block" : "hidden sm:block"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-slate-900">
                        Foto Bukti / Selfie Kehadiran <span className="text-rose-500">*Wajib</span>
                      </label>
                      <p className="text-[11px] text-slate-500">
                        {status === "HADIR"
                          ? "Ambil foto selfie langsung wajah Anda."
                          : "Ambil foto diri atau lampirkan foto surat dokter / keterangan izin."}
                      </p>
                    </div>
                    {photo && (
                      <button
                        type="button"
                        onClick={() => setPhoto(null)}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Ambil Ulang
                      </button>
                    )}
                  </div>

                  {/* Tampilan Live Video / Preview Foto */}
                  <div className="flex flex-col items-center justify-center">
                    {isCameraActive ? (
                      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-square flex items-center justify-center shadow-xl">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3">
                          <button
                            type="button"
                            onClick={takeSelfie}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 text-white rounded-xl text-xs font-bold shadow-lg hover:from-emerald-500 hover:to-teal-600 flex items-center gap-2"
                          >
                            <Camera className="w-4 h-4" /> Ambil Foto Sekarang
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-3.5 py-2 bg-white/90 text-slate-800 rounded-xl text-xs font-bold hover:bg-white shadow-sm"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : photo ? (
                      <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-emerald-600 shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} alt="Bukti Kehadiran" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-center py-4">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition"
                        >
                          <Camera className="w-4 h-4" /> Buka Kamera Selfie
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Catatan / Keterangan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Keterangan Tambahan (Opsional):
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan catatan, alasan izin/sakit, atau jam kedatangan..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
              />
            </div>

            {/* Tombol Simpan */}
            <button
              type="submit"
              disabled={loading || (isPhotoRequired && !photo)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-emerald-600/25 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Presensi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kirim Data Presensi</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ===== DESKTOP: Absensi Orang Tua / Wali (Disatukan di tengah antara Form Murid & Riwayat Presensi) ===== */}
        {currentUser.role === "MURID" && (
          <div className="hidden sm:block">
            <ParentAttendanceForm
              studentName={currentUser.name}
              initialHistory={initialParentHistory}
            />
          </div>
        )}

        </div>
        {/* ===== END HOME VIEW ===== */}

        {/* Riwayat Presensi Saya — Desktop only (mobile punya halaman sendiri di atas) */}
        <div
          id="riwayat-presensi"
          className="hidden sm:block bg-white/95 backdrop-blur-xl rounded-3xl border border-emerald-100/90 shadow-[0_15px_40px_rgba(16,185,129,0.12)] overflow-hidden text-slate-800 scroll-mt-20"
        >
          <div className="px-6 py-4.5 border-b border-emerald-100/80 flex items-center justify-between bg-emerald-50/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Riwayat Presensi Saya</h4>
                <p className="text-[11px] text-slate-500">Daftar kehadiran yang baru Anda ajukan</p>
              </div>
            </div>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              {history.length} Catatan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Tanggal & Waktu</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Status Approval</th>
                  <th className="px-6 py-3">Foto / Bukti</th>
                  <th className="px-6 py-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                      Belum ada data kehadiran yang tercatat.
                    </td>
                  </tr>
                ) : (
                  history
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-slate-800">
                          {new Date(item.createdAt).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="block text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            item.status === "HADIR"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "BELUM_HADIR"
                              ? "bg-amber-100 text-amber-700"
                              : item.status === "IZIN"
                              ? "bg-blue-100 text-blue-700"
                              : item.status === "SAKIT"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {item.approvalStatus === "APPROVED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Disetujui
                          </span>
                        ) : item.approvalStatus === "REJECTED" ? (
                          <span
                            title={item.rejectionReason || "Ditolak"}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 cursor-help"
                          >
                            <XCircle className="w-3 h-3" /> Ditolak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock3 className="w-3 h-3" /> Menunggu Review
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {item.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.photo}
                            alt="Bukti Kehadiran"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Tidak ada</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {item.notes || "-"}
                        {item.rejectionReason && (
                          <span className="block text-rose-600 font-medium text-[10px] mt-0.5">
                            Alasan: {item.rejectionReason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Slider (Maksimal 5 data per halaman / slide) */}
          {history.length > itemsPerPage && (
            <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> -{" "}
                <span className="font-bold text-slate-800">
                  {Math.min(currentPage * itemsPerPage, history.length)}
                </span>{" "}
                dari <span className="font-bold text-slate-800">{history.length}</span> catatan presensi
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition"
                  aria-label="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from(
                  { length: Math.ceil(history.length / itemsPerPage) },
                  (_, i) => i + 1
                ).map((num) => {
                  const isActive = num === currentPage;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCurrentPage(num)}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition flex items-center justify-center ${
                        isActive
                          ? "bg-[#e11d48] text-white shadow-md shadow-rose-200"
                          : "text-slate-600 hover:bg-slate-200/60"
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === Math.ceil(history.length / itemsPerPage)}
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(history.length / itemsPerPage), p + 1)
                    )
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition"
                  aria-label="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Pop Up Peringatan Status Approval untuk Murid & Guru */}
      {activePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-100 overflow-hidden relative">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  activePopup.approvalStatus === "REJECTED"
                    ? "bg-rose-100 text-rose-600 shadow-md shadow-rose-100"
                    : "bg-amber-100 text-amber-600 shadow-md shadow-amber-100"
                }`}
              >
                {activePopup.approvalStatus === "REJECTED" ? (
                  <AlertTriangle className="w-7 h-7 text-rose-600 animate-bounce" />
                ) : (
                  <Clock3 className="w-7 h-7 animate-pulse" />
                )}
              </div>
              <div className="flex-1">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                    activePopup.approvalStatus === "REJECTED"
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}
                >
                  {activePopup.approvalStatus === "REJECTED"
                    ? "PRESENSI ANDA DITOLAK (REJECTED)"
                    : "Menunggu Persetujuan Admin"}
                </span>
                <h3 className="text-lg font-extrabold text-slate-800">
                  {activePopup.approvalStatus === "REJECTED"
                    ? "Perhatian: Wajib Mengisi Ulang Presensi!"
                    : "Pemberitahuan Status Presensi"}
                </h3>

                {activePopup.approvalStatus === "REJECTED" ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Presensi Anda status <strong>{activePopup.status}</strong> pada tanggal{" "}
                      {new Date(activePopup.createdAt).toLocaleDateString("id-ID")} telah{" "}
                      <strong className="text-rose-600">ditolak</strong> oleh Superadmin / Admin.
                    </p>

                    <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200">
                      <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                        Alasan Penolakan dari Admin:
                      </p>
                      <p className="text-xs font-semibold text-rose-700 mt-1">
                        &quot;{activePopup.rejectionReason || "Data atau foto selfie tidak valid"}&quot;
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Silakan tutup jendela ini dan <strong>lakukan pengisian presensi ulang</strong> dengan kamera selfie atau data yang benar.
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Presensi Anda status <strong>{activePopup.status}</strong> pada{" "}
                    {new Date(activePopup.createdAt).toLocaleDateString("id-ID")} saat ini{" "}
                    <strong>belum di-approve</strong> oleh role Superadmin atau Admin. Harap menunggu hingga data Anda diverifikasi.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (activePopup) {
                    setDismissedPopupIds((prev) => new Set(prev).add(activePopup.id));
                  }
                  setActivePopup(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-2 ${
                  activePopup.approvalStatus === "REJECTED"
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                {activePopup.approvalStatus === "REJECTED" ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tutup &amp; Isi Ulang Presensi Sekarang</span>
                  </>
                ) : (
                  "Saya Mengerti"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Khusus Role Murid & Guru di Mobile) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-2xl border-t border-emerald-200/70 px-3 py-2 shadow-[0_-8px_30px_rgba(16,185,129,0.15)] safe-area-pb">
        <div className="flex items-center justify-around max-w-md mx-auto relative">
          {/* 1. Edit Profil / Akun */}
          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl text-slate-500 hover:text-slate-800 transition"
          >
            <UserCheck2 className="w-5 h-5 text-emerald-600 stroke-[1.8]" />
            <span className="text-[10px] font-medium tracking-tight">Akun</span>
          </button>

          {/* 2. Riwayat Presensi Saya (Di dekat fitur Akun) */}
          <button
            type="button"
            onClick={() => {
              setMobileView("riwayat");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition ${
              mobileView === "riwayat" ? "text-emerald-600 font-black scale-105 bg-emerald-50 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-5 h-5 text-emerald-600 stroke-[1.8]" />
            <span className="text-[10px] font-medium tracking-tight">Riwayat</span>
          </button>

          {/* 3. Tombol Kamera Tengah / Selfie (Floating Action Button di posisi tengah/riwayat sebelumnya) */}
          <div className="relative -top-4 flex flex-col items-center">
            <button
              type="button"
              onClick={() => {
                setMobileView("home");
                setMobileShowCamera(true);
                setTimeout(() => {
                  const cameraSection = document.getElementById("kamera-selfie");
                  if (cameraSection) {
                    cameraSection.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                  if (!isCameraActive && !photo) {
                    startCamera();
                  }
                }, 50);
              }}
              className="w-13 h-13 rounded-full bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 ring-4 ring-white hover:scale-105 active:scale-95 transition"
              aria-label="Foto Bukti / Selfie Kehadiran"
              title="Foto Bukti / Selfie Kehadiran"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
            <span className="text-[9px] font-bold text-emerald-600 mt-1 whitespace-nowrap">
              Selfie
            </span>
          </div>

          {/* 4. Absensi Orang Tua (Khusus Role MURID di Mobile) */}
          {currentUser.role === "MURID" && (
            <button
              type="button"
              onClick={() => {
                setMobileView("orangtua");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition ${
                mobileView === "orangtua" ? "text-emerald-700 font-black scale-105 bg-emerald-50 shadow-xs ring-1 ring-emerald-200" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users2 className="w-5 h-5 text-emerald-600 stroke-[1.8]" />
              <span className="text-[10px] font-medium tracking-tight">Orang Tua</span>
            </button>
          )}

          {/* 5. Keluar */}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl text-rose-500 hover:text-rose-600 transition"
          >
            <LogOut className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] font-medium tracking-tight">Keluar</span>
          </button>
        </div>
      </nav>

      {/* Modal Edit Profil Mandiri */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={{
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          email: currentUser.email,
          phone: currentUser.phone,
          role: currentUser.role,
          kelas: currentUser.kelas,
          image: currentUser.image,
        }}
        onProfileUpdated={(updated) => {
          setCurrentUser((prev) => ({
            ...prev,
            ...updated,
            role: prev.role,
          }));
          router.refresh();
        }}
      />
    </div>
  );
}





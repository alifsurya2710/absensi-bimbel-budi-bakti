"use client";

import { useState } from "react";
import {
  Users2,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  XCircle,
  Phone,
  User,
  Send,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";

interface ParentAttendanceRecord {
  id: string;
  parentName: string;
  parentPhone: string;
  status: "HADIR" | "BELUM_HADIR" | "IZIN" | "SAKIT" | "TIDAK_HADIR";
  notes?: string | null;
  createdAt: string;
}

interface ParentAttendanceFormProps {
  studentName?: string | null;
  initialHistory?: ParentAttendanceRecord[];
}

export default function ParentAttendanceForm({
  studentName,
  initialHistory = [],
}: ParentAttendanceFormProps) {
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [status, setStatus] = useState<"HADIR" | "BELUM_HADIR" | "IZIN" | "SAKIT" | "TIDAK_HADIR">("HADIR");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<ParentAttendanceRecord[]>(initialHistory);

  const statusOptions = [
    {
      value: "HADIR",
      label: "Hadir",
      desc: "Kunjungan / Datang",
      icon: CheckCircle2,
      color: "border-emerald-500 bg-emerald-50 text-emerald-700",
      activeColor: "bg-emerald-600 text-white shadow-emerald-200",
    },
    {
      value: "BELUM_HADIR",
      label: "Belum Hadir",
      desc: "Menunggu Jadwal",
      icon: Clock,
      color: "border-amber-500 bg-amber-50 text-amber-700",
      activeColor: "bg-amber-500 text-white shadow-amber-200",
    },
    {
      value: "IZIN",
      label: "Izin",
      desc: "Ada Kepentingan",
      icon: FileText,
      color: "border-blue-500 bg-blue-50 text-blue-700",
      activeColor: "bg-blue-600 text-white shadow-blue-200",
    },
    {
      value: "SAKIT",
      label: "Sakit",
      desc: "Kondisi Kurang Sehat",
      icon: AlertCircle,
      color: "border-purple-500 bg-purple-50 text-purple-700",
      activeColor: "bg-purple-600 text-white shadow-purple-200",
    },
    {
      value: "TIDAK_HADIR",
      label: "Tidak Hadir",
      desc: "Tanpa Keterangan",
      icon: XCircle,
      color: "border-rose-500 bg-rose-50 text-rose-700",
      activeColor: "bg-rose-600 text-white shadow-rose-200",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!parentName.trim()) {
      setError("Mohon isi Nama Lengkap Orang Tua / Wali.");
      return;
    }

    if (!parentPhone.trim()) {
      setError("Mohon isi Nomor Telepon Orang Tua / Wali.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/parent-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: parentName.trim(),
          parentPhone: parentPhone.trim(),
          status,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mencatat absensi orang tua.");
      }

      setSuccess("Absensi kunjungan orang tua berhasil dicatat!");
      setParentName("");
      setParentPhone("");
      setNotes("");
      setStatus("HADIR");

      if (data.record) {
        setHistory((prev) => [
          {
            id: data.record.id,
            parentName: data.record.parentName,
            parentPhone: data.record.parentPhone,
            status: data.record.status,
            notes: data.record.notes,
            createdAt: data.record.createdAt,
          },
          ...prev,
        ]);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan sistem.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-emerald-100 shadow-[0_15px_40px_rgba(16,185,129,0.08)] p-6 sm:p-8 text-slate-800 space-y-6">
      {/* Header Form */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-100 shrink-0">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Absensi Orang Tua / Wali
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Opsional
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Diisi khusus saat ada orang tua/wali dari <strong>{studentName || "murid"}</strong> yang berkunjung atau mendampingi ke bimbel.
            </p>
          </div>
        </div>
      </div>

      {/* Pesan Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Input */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nama Orang Tua */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nama Orang Tua / Wali</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Contoh: Bapak Hendra / Ibu Siti"
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs transition"
              required
            />
          </div>

          {/* Nomor HP Orang Tua */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-sky-500" />
              <span>Nomor Telepon / WhatsApp Orang Tua</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs transition"
              required
            />
          </div>
        </div>

        {/* Pilihan Status Kunjungan */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Status Kehadiran Orang Tua:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {statusOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value as typeof status)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 shadow-2xs cursor-pointer ${
                    isSelected
                      ? `${opt.activeColor} shadow-md border-transparent font-bold scale-[1.02]`
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className="w-4 h-4" />
                    {isSelected && <Sparkles className="w-3 h-3 opacity-80" />}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold leading-tight">{opt.label}</p>
                    <p className={`text-[10px] mt-0.5 ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Keperluan / Catatan */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Keperluan / Catatan Kunjungan (Opsional):
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Konsultasi perkembangan belajar murid, menjemput, atau izin..."
            className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs transition"
          />
        </div>

        {/* Tombol Simpan */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-100 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan Absensi Orang Tua...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Simpan Absensi Kunjungan Orang Tua</span>
            </>
          )}
        </button>
      </form>

      {/* Riwayat Singkat Absensi Orang Tua Murid Ini */}
      {history.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Riwayat Kunjungan Orang Tua Anda ({history.length})</span>
            </h4>
          </div>

          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden bg-slate-50/50">
            {history.slice(0, 5).map((item) => (
              <div key={item.id} className="p-3 text-xs flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="font-bold text-slate-800 truncate">
                    {item.parentName}
                    <span className="text-[11px] font-normal text-slate-400 ml-2">
                      ({item.parentPhone})
                    </span>
                  </p>
                  {item.notes && (
                    <p className="text-[11px] text-slate-500 truncate">&ldquo;{item.notes}&rdquo;</p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    WIB
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



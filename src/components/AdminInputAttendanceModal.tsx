"use client";

import { useState } from "react";
import {
  X,
  UserCheck2,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  Thermometer,
  XCircle,
} from "lucide-react";

interface UserOption {
  id: string;
  name: string | null;
  username: string | null;
  role: "GURU" | "MURID" | "ADMIN" | "SUPERADMIN";
  kelas?: string | null;
}

interface AdminInputAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserOption[];
  onSuccess: (newAttendance: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function AdminInputAttendanceModal({
  isOpen,
  onClose,
  users,
  onSuccess,
}: AdminInputAttendanceModalProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [status, setStatus] = useState<"TIDAK_HADIR" | "IZIN" | "SAKIT" | "HADIR">("TIDAK_HADIR");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("Alpa / Tidak hadir tanpa keterangan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    if (u.role !== "GURU" && u.role !== "MURID") return false;
    const term = searchTerm.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(term);
    const usernameMatch = u.username?.toLowerCase().includes(term);
    const kelasMatch = u.kelas?.toLowerCase().includes(term);
    return nameMatch || usernameMatch || kelasMatch;
  });

  const statusOptions = [
    {
      value: "TIDAK_HADIR",
      label: "Alpa / Tidak Hadir",
      desc: "Tanpa keterangan / absen",
      icon: XCircle,
      color: "border-rose-500 bg-rose-50/70 text-rose-700",
      defaultNote: "Alpa / Tidak hadir tanpa keterangan",
    },
    {
      value: "IZIN",
      label: "Izin",
      desc: "Dispensasi / keperluan",
      icon: FileText,
      color: "border-sky-400 bg-sky-50/70 text-sky-700",
      defaultNote: "Izin tidak dapat hadir",
    },
    {
      value: "SAKIT",
      label: "Sakit",
      desc: "Kondisi tidak fit",
      icon: Thermometer,
      color: "border-purple-500 bg-purple-50/70 text-purple-700",
      defaultNote: "Sakit",
    },
    {
      value: "HADIR",
      label: "Hadir Manual",
      desc: "Diverifikasi langsung oleh admin",
      icon: CheckCircle2,
      color: "border-emerald-500 bg-emerald-50/70 text-emerald-700",
      defaultNote: "Kehadiran dicatat manual oleh Admin",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError("Silakan pilih guru atau murid terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/attendance/admin-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          status,
          date,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mencatat presensi.");
      }

      onSuccess(data.attendance);
      onClose();
      // Reset form
      setSelectedUserId("");
      setStatus("TIDAK_HADIR");
      setNotes("Alpa / Tidak hadir tanpa keterangan");
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(errText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <UserCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Input Presensi / Alpa Manual
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan langsung untuk Murid atau Guru yang tidak hadir
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1">
          {/* Pilih Pengguna (Guru / Murid) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Guru / Murid <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Cari nama, username, atau kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full mb-2 p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-slate-200 p-1.5 bg-slate-50/50">
              {filteredUsers.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400 italic">
                  Data murid atau guru tidak ditemukan.
                </p>
              ) : (
                filteredUsers.map((u) => {
                  const isChosen = selectedUserId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setError("");
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                        isChosen
                          ? "bg-emerald-600 text-white font-bold shadow-xs"
                          : "hover:bg-slate-200/60 text-slate-700 bg-white"
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-semibold">{u.name}</span>{" "}
                        <span className={isChosen ? "text-emerald-200" : "text-slate-400"}>
                          (@{u.username || "-"})
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase shrink-0 ${
                          isChosen
                            ? "bg-white/20 text-white"
                            : u.role === "GURU"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {u.role} {u.kelas ? `• ${u.kelas}` : ""}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Tanggal Presensi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tanggal Presensi
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Status Kehadiran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Status yang Ditetapkan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setStatus(opt.value as any); // eslint-disable-line @typescript-eslint/no-explicit-any
                      setNotes(opt.defaultNote);
                    }}
                    className={`p-3 rounded-2xl border-2 text-left flex flex-col gap-1 transition ${
                      isSelected
                        ? opt.color + " shadow-xs font-bold ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-extrabold">{opt.label}</span>
                    </div>
                    <span className="text-[10px] opacity-75">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catatan / Keterangan Tambahan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan Alasan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tuliskan keterangan tambahan jika ada..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <Clock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Presensi yang diinput oleh Administrator otomatis berstatus <strong>APPROVED</strong> dan langsung muncul di riwayat presensi pengguna.
            </span>
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !selectedUserId}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 flex items-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Simpan Presensi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



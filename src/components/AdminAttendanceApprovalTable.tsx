"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  Filter,
  AlertTriangle,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Trash2,
} from "lucide-react";
import AdminInputAttendanceModal from "@/components/AdminInputAttendanceModal";

interface AttendanceRecord {
  id: string;
  status: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  notes?: string | null;
  photo?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    role: "GURU" | "MURID" | "ADMIN" | "SUPERADMIN";
    kelas?: string | null;
    phone?: string | null;
  };
}

interface UserOption {
  id: string;
  name: string | null;
  username: string | null;
  role: "GURU" | "MURID" | "ADMIN" | "SUPERADMIN";
  kelas?: string | null;
}

interface AttendanceTableProps {
  initialAttendances: AttendanceRecord[];
  users?: UserOption[];
}

export default function AdminAttendanceApprovalTable({ initialAttendances, users = [] }: AttendanceTableProps) {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(initialAttendances);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filterApproval, setFilterApproval] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const itemsPerPage = 10;

  // Modal Khusus Reject yang Mewah & Rapi
  const [rejectingItem, setRejectingItem] = useState<AttendanceRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [quickReason, setQuickReason] = useState("Foto selfie buram / wajah tidak jelas");

  // Modal Konfirmasi Hapus Presensi
  const [deletingItem, setDeletingItem] = useState<AttendanceRecord | null>(null);

  const quickReasonOptions = [
    "Foto selfie buram / wajah tidak jelas",
    "Foto bukan di lokasi bimbel",
    "Surat dokter / bukti izin tidak valid atau tidak terlampir",
    "Waktu presensi tidak sesuai jadwal belajar",
    "Data keterangan tidak lengkap",
  ];

  const handleOpenRejectModal = (item: AttendanceRecord) => {
    setRejectingItem(item);
    setRejectionReason(quickReason);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;

    const reasonToSubmit = rejectionReason.trim() || quickReason;
    setLoadingId(rejectingItem.id);

    try {
      const res = await fetch(`/api/attendance/${rejectingItem.id}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalStatus: "REJECTED",
          rejectionReason: reasonToSubmit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses penolakan");

      setAttendances((prev) =>
        prev.map((item) =>
          item.id === rejectingItem.id
            ? { ...item, approvalStatus: "REJECTED", rejectionReason: reasonToSubmit }
            : item
        )
      );
      setRejectingItem(null);
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert(errText);
    } finally {
      setLoadingId(null);
    }
  };

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/attendance/${id}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus: "APPROVED" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses persetujuan");

      setAttendances((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, approvalStatus: "APPROVED", rejectionReason: null } : item
        )
      );
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert(errText);
    } finally {
      setLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const targetId = deletingItem.id;
    setLoadingId(targetId);

    try {
      const res = await fetch(`/api/attendance/${targetId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus data presensi.");

      // Hapus data dari state tabel secara instan (realtime)
      setAttendances((prev) => prev.filter((item) => item.id !== targetId));
      setDeletingItem(null);
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Terjadi kesalahan";
      alert(errText);
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = attendances.filter((item) => {
    if (filterApproval !== "ALL" && item.approvalStatus !== filterApproval) return false;
    return true;
  });

  // Pagination (10 data per halaman / slide)
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedAttendances = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Header & Filter */}
      <div className="border-b border-slate-100 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Persetujuan & Monitoring Presensi (Approval)</h3>
          <p className="text-xs text-slate-400">
            Setujui (Approve) atau Tolak (Reject) pengisian presensi dari guru dan murid beserta alasan penolakan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsInputModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Isi Alpa / Presensi Manual</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <button
              onClick={() => {
                setFilterApproval("ALL");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterApproval === "ALL" ? "bg-white text-slate-800 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => {
                setFilterApproval("PENDING");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterApproval === "PENDING" ? "bg-white text-amber-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Pending ({attendances.filter((a) => a.approvalStatus === "PENDING").length})
            </button>
            <button
              onClick={() => {
                setFilterApproval("APPROVED");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterApproval === "APPROVED" ? "bg-white text-emerald-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => {
                setFilterApproval("REJECTED");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterApproval === "REJECTED" ? "bg-white text-rose-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Table Container dengan Touch Scroll & Petunjuk Geser di Mobile */}
      <div className="relative">
        <div className="sm:hidden px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            Tabel dapat digeser ke samping
          </span>
          <span className="text-sky-600 font-semibold tracking-wide">Geser &rarr;</span>
        </div>

        <div className="overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-thin">
          <table className="w-full min-w-[700px] text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-400">
            <tr>
              <th className="px-6 py-3.5">Nama & Peran</th>
              <th className="px-6 py-3.5">Status Presensi</th>
              <th className="px-6 py-3.5">Bukti Foto / Selfie</th>
              <th className="px-6 py-3.5">Keterangan</th>
              <th className="px-6 py-3.5">Waktu Input</th>
              <th className="px-6 py-3.5 text-center">Status Approval</th>
              <th className="px-6 py-3.5 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedAttendances.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic">
                  Tidak ada catatan presensi dalam filter ini.
                </td>
              </tr>
            ) : (
              paginatedAttendances.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-3.5">
                    <p className="font-bold text-slate-800">{att.user.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {att.user.role} {att.user.kelas ? `• ${att.user.kelas}` : ""} • @{att.user.username || "-"}
                    </p>
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        att.status === "HADIR"
                          ? "bg-emerald-100 text-emerald-700"
                          : att.status === "BELUM_HADIR"
                          ? "bg-amber-100 text-amber-700"
                          : att.status === "IZIN"
                          ? "bg-blue-100 text-blue-700"
                          : att.status === "SAKIT"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {att.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    {att.photo ? (
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(att.photo || null)}
                        className="group relative block w-11 h-11 rounded-xl overflow-hidden border-2 border-indigo-200 hover:border-indigo-600 transition shadow-xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={att.photo}
                          alt="Foto Bukti"
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <ExternalLink className="w-3.5 h-3.5 text-white" />
                        </div>
                      </button>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Tanpa foto</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 max-w-xs">
                    <p className="truncate">{att.notes || "-"}</p>
                    {att.rejectionReason && (
                      <div className="mt-1 p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold">
                        ⚠️ Alasan Tolak: {att.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        {new Date(att.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        {new Date(att.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        att.approvalStatus === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : att.approvalStatus === "REJECTED"
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {att.approvalStatus === "APPROVED" && <CheckCircle2 className="w-3 h-3" />}
                      {att.approvalStatus === "REJECTED" && <XCircle className="w-3 h-3" />}
                      {att.approvalStatus === "PENDING" && <Clock className="w-3 h-3" />}
                      {att.approvalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={loadingId === att.id || att.approvalStatus === "APPROVED"}
                        onClick={() => handleApprove(att.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-40"
                      >
                        {loadingId === att.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Approve"
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={loadingId === att.id}
                        onClick={() => handleOpenRejectModal(att)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition disabled:opacity-40 ${
                          att.approvalStatus === "REJECTED"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700"
                        }`}
                      >
                        {att.approvalStatus === "REJECTED" ? "Edit Tolak" : "Reject"}
                      </button>
                      <button
                        type="button"
                        disabled={loadingId === att.id}
                        onClick={() => setDeletingItem(att)}
                        className="p-1.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition disabled:opacity-40"
                        title="Hapus Data Presensi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination Controls (10 data per halaman / slide) */}
      {filtered.length > itemsPerPage && (
        <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            Menampilkan <span className="font-bold text-slate-800">{(safePage - 1) * itemsPerPage + 1}</span> -{" "}
            <span className="font-bold text-slate-800">
              {Math.min(safePage * itemsPerPage, filtered.length)}
            </span>{" "}
            dari <span className="font-bold text-slate-800">{filtered.length}</span> catatan presensi
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
              const isActive = num === safePage;
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
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Desain Penolakan (Reject) yang Bagus & Elegan */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-rose-100 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700">
                    Form Penolakan Presensi
                  </span>
                  <button
                    type="button"
                    onClick={() => setRejectingItem(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mt-1">
                  Tolak Presensi {rejectingItem.user.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Peran: <strong>{rejectingItem.user.role}</strong> • Status yang diisi:{" "}
                  <strong>{rejectingItem.status}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmReject} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Alasan Cepat (Template):
                </label>
                <div className="space-y-1.5">
                  {quickReasonOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setQuickReason(opt);
                        setRejectionReason(opt);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition ${
                        rejectionReason === opt
                          ? "border-rose-500 bg-rose-50/70 font-bold text-rose-800 shadow-2xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      • {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Atau Tulis Alasan Spesifik (Akan Dilihat oleh Pengguna):
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Jelaskan alasan penolakan secara jelas agar siswa/guru paham..."
                  className="w-full p-3 text-xs text-slate-900 bg-white placeholder:text-slate-400 rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Ketika ditolak, pop-up peringatan merah wajib absen ulang beserta alasan ini akan langsung muncul di layar {rejectingItem.user.role.toLowerCase()} bersangkutan.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingId === rejectingItem.id || !rejectionReason.trim()}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {loadingId === rejectingItem.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Konfirmasi Tolak (Reject)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Preview Foto */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-lg w-full bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto}
              alt="Bukti Kehadiran Full"
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
            <div className="p-3 text-center">
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input Presensi / Alpa Manual */}
      <AdminInputAttendanceModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        users={users}
        onSuccess={(newAttendance) => {
          setAttendances((prev) => [newAttendance, ...prev]);
        }}
      />

      {/* Modal Konfirmasi Hapus Presensi */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-rose-100 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  Hapus Data Presensi?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data presensi milik{" "}
                  <strong className="text-slate-800">{deletingItem.user.name}</strong> ({deletingItem.user.role}) pada tanggal{" "}
                  {new Date(deletingItem.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}?
                </p>
                <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 leading-snug">
                  Data yang dihapus akan hilang permanen dari database dan tidak dapat dipulihkan.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={loadingId === deletingItem.id}
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loadingId === deletingItem.id}
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {loadingId === deletingItem.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Users2,
  Search,
  Phone,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  XCircle,
} from "lucide-react";

export interface ParentAttendanceItem {
  id: string;
  parentName: string;
  parentPhone: string;
  status: "HADIR" | "BELUM_HADIR" | "IZIN" | "SAKIT" | "TIDAK_HADIR";
  notes?: string | null;
  createdAt: string;
  student: {
    id: string;
    name: string | null;
    username: string | null;
    kelas?: string | null;
    image?: string | null;
    phone?: string | null;
  };
}

interface ParentAttendanceTableProps {
  initialRecords: ParentAttendanceItem[];
}

export default function ParentAttendanceTable({
  initialRecords = [],
}: ParentAttendanceTableProps) {
  const [records] = useState<ParentAttendanceItem[]>(initialRecords);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredRecords = records.filter((r) => {
    const query = search.toLowerCase();
    const matchSearch =
      r.parentName.toLowerCase().includes(query) ||
      r.parentPhone.toLowerCase().includes(query) ||
      (r.student?.name && r.student.name.toLowerCase().includes(query)) ||
      (r.student?.kelas && r.student.kelas.toLowerCase().includes(query)) ||
      (r.notes && r.notes.toLowerCase().includes(query));

    const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HADIR":
        return {
          icon: CheckCircle2,
          color: "bg-emerald-100 text-emerald-700 border-emerald-200",
          label: "Hadir",
        };
      case "BELUM_HADIR":
        return {
          icon: Clock,
          color: "bg-amber-100 text-amber-700 border-amber-200",
          label: "Belum Hadir",
        };
      case "IZIN":
        return {
          icon: FileText,
          color: "bg-blue-100 text-blue-700 border-blue-200",
          label: "Izin",
        };
      case "SAKIT":
        return {
          icon: AlertCircle,
          color: "bg-purple-100 text-purple-700 border-purple-200",
          label: "Sakit",
        };
      default:
        return {
          icon: XCircle,
          color: "bg-rose-100 text-rose-700 border-rose-200",
          label: "Tidak Hadir",
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden text-slate-800">
      {/* Header & Filter Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-100 shrink-0">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Data Absensi Kunjungan Orang Tua
              </h3>
              <p className="text-xs text-slate-500">
                Monitoring kehadiran orang tua/wali siswa saat berkunjung ke FORSIREMIS
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100 self-start sm:self-auto">
            Total {filteredRecords.length} Kunjungan
          </span>
        </div>

        {/* Pencarian & Filter Status */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama orang tua, nama murid, kelas, atau no. telepon..."
              className="w-full pl-10 pr-4 py-2.5 text-xs text-slate-900 bg-slate-50/70 placeholder:text-slate-400 font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "HADIR", "BELUM_HADIR", "IZIN", "SAKIT", "TIDAK_HADIR"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setFilterStatus(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition whitespace-nowrap cursor-pointer ${
                  filterStatus === st
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {st === "ALL" ? "Semua Status" : st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabel Data Desktop & Mobile Responsive */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 min-w-[760px]">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3.5">Nama Orang Tua & Kontak</th>
              <th className="px-6 py-3.5">Nama Murid (Anak)</th>
              <th className="px-6 py-3.5">Status Kehadiran</th>
              <th className="px-6 py-3.5">Tanggal & Jam Kunjungan</th>
              <th className="px-6 py-3.5">Keperluan / Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                  Belum ada data kunjungan orang tua yang tercatat sesuai filter.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((item) => {
                const badge = getStatusBadge(item.status);
                const BadgeIcon = badge.icon;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* Orang Tua */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {item.parentName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 leading-tight">
                            {item.parentName}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{item.parentPhone}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Murid */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        {item.student?.image ? (
                          <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-2xs border border-sky-200 shrink-0">
                            <Image
                              src={item.student.image}
                              alt={item.student.name || "Foto Murid"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {item.student?.name ? item.student.name.charAt(0).toUpperCase() : "M"}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800">
                            {item.student?.name || "Murid Tidak Diketahui"}
                          </p>
                          <p className="text-[11px] text-sky-600 font-semibold">
                            {item.student?.kelas ? `Kelas ${item.student.kelas}` : "Murid Bimbel"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${badge.color}`}
                      >
                        <BadgeIcon className="w-3.5 h-3.5" />
                        <span>{badge.label}</span>
                      </span>
                    </td>

                    {/* Tanggal & Jam */}
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-bold text-xs">
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Pukul{" "}
                        {new Date(item.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </p>
                    </td>

                    {/* Catatan / Keperluan */}
                    <td className="px-6 py-4 max-w-xs">
                      {item.notes ? (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-relaxed">
                          &ldquo;{item.notes}&rdquo;
                        </p>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          Tanpa keterangan khusus
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  UserCheck,
  X,
  FileDown,
  Eye,
  EyeOff,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: "GURU" | "MURID" | "ADMIN" | "SUPERADMIN";
  kelas?: string | null;
  createdAt: string;
  _count?: {
    attendances: number;
  };
}

interface UserManagementProps {
  initialUsers: UserItem[];
  currentUserRole?: "SUPERADMIN" | "ADMIN";
}

export default function UserManagementSection({ initialUsers, currentUserRole = "ADMIN" }: UserManagementProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const isSuperadmin = currentUserRole === "SUPERADMIN";
  const [filterRole, setFilterRole] = useState<"ALL" | "ADMIN" | "GURU" | "MURID">("ALL");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "MURID" as "ADMIN" | "GURU" | "MURID",
    kelas: "XII RPL 1",
  });

  // Validasi kriteria password
  const pwd = formData.password;
  const hasMinLength = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[@$!%*?&]/.test(pwd);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  // Excel Import / Export State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter List
  const filteredUsers = users.filter((u) => {
    if (filterRole !== "ALL" && u.role !== filterRole) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchUsername = u.username?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchPhone = u.phone?.toLowerCase().includes(q);
      const matchKelas = u.kelas?.toLowerCase().includes(q);
      return matchName || matchUsername || matchEmail || matchPhone || matchKelas;
    }
    return true;
  });

  // Pagination (5 data per halaman)
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setShowPassword(false);
    setFormData({
      name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      role: "MURID",
      kelas: "XII RPL 1",
    });
    setIsModalOpen(true);
    setMessage(null);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setShowPassword(false);
    setFormData({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "", // Kosongkan jika tidak ingin ganti password
      role: (user.role === "ADMIN" ? "ADMIN" : user.role === "GURU" ? "GURU" : "MURID"),
      kelas: user.kelas || "XII RPL 1",
    });
    setIsModalOpen(true);
    setMessage(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi password saat tambah user baru ATAU jika password diisi saat edit
    if (!editingUser || (editingUser && formData.password.trim())) {
      if (!isPasswordValid) {
        setMessage({
          type: "error",
          text: "Password harus memenuhi semua kriteria: minimal 8 karakter, huruf besar, huruf kecil, angka, dan simbol unik (@$!%*?&).",
        });
        return;
      }
    }

    setLoading(true);
    setMessage(null);

    try {
      if (editingUser) {
        // Edit User
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui pengguna");

        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...data.user } : u))
        );
        setMessage({ type: "success", text: "Pengguna berhasil diperbarui!" });
        setIsModalOpen(false);
      } else {
        // Add User
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal menambahkan pengguna");

        setUsers([data.user, ...users]);
        setMessage({ type: "success", text: "Pengguna baru berhasil ditambahkan!" });
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Terjadi kesalahan";
      setMessage({ type: "error", text: errText });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string | null) => {
    if (!confirm(`Yakin ingin menghapus pengguna '${name || "User"}'? Semua riwayat presensinya juga akan dihapus.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus pengguna");

      setUsers((prev) => prev.filter((u) => u.id !== id));
      setMessage({ type: "success", text: "Pengguna berhasil dihapus." });
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Gagal menghapus";
      setMessage({ type: "error", text: errText });
    }
  };

  const handleImportExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setImportLoading(true);
    setImportResult(null);

    try {
      const fd = new FormData();
      fd.append("file", importFile);

      const res = await fetch("/api/excel/import", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengimpor file Excel");

      setImportResult(data.results);
      setMessage({ type: "success", text: data.message });

      // Refresh list pengguna
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Gagal mengimpor Excel";
      setMessage({ type: "error", text: errText });
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifikasi Pesan */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Action Header: Search, Filter, Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search & Role Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama, username, no hp..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setFilterRole("ALL");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterRole === "ALL" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Semua ({users.length})
            </button>
            {/* Filter Pill Admin (Hanya Tampil Jika Login sebagai Superadmin) */}
            {isSuperadmin && (
              <button
                onClick={() => {
                  setFilterRole("ADMIN");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterRole === "ADMIN" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Admin ({users.filter((u) => u.role === "ADMIN").length})
              </button>
            )}
            <button
              onClick={() => {
                setFilterRole("GURU");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterRole === "GURU" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Guru ({users.filter((u) => u.role === "GURU").length})
            </button>
            <button
              onClick={() => {
                setFilterRole("MURID");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterRole === "MURID" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Murid ({users.filter((u) => u.role === "MURID").length})
            </button>
          </div>
        </div>

        {/* Action Buttons: Tambah User, Import Excel, Export Rekapitulasi */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/excel/import"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
            title="Download Rekapitulasi Keaktifan Pengisian Fitur Murid & Guru"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Rekap Excel</span>
          </a>

          <button
            type="button"
            onClick={() => {
              setIsImportModalOpen(true);
              setImportResult(null);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {isSuperadmin ? "Manajemen Data Admin, Guru, & Murid" : "Manajemen Data Murid & Guru"}
            </h3>
            <p className="text-xs text-slate-400">
              Kelola akun, kelas, kredensial, serta pantau total pengisian presensi masing-masing role.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {filteredUsers.length} Pengguna
          </span>
        </div>

        <div className="relative">
          <div className="sm:hidden px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              Tabel dapat digeser ke samping
            </span>
            <span className="text-sky-600 font-semibold tracking-wide">Geser &rarr;</span>
          </div>

          <div className="overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-thin">
            <table className="w-full min-w-[680px] text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Nama & Username</th>
                <th className="px-6 py-3.5">Peran (Role)</th>
                <th className="px-6 py-3.5">Kelas</th>
                <th className="px-6 py-3.5">Kontak</th>
                <th className="px-6 py-3.5 text-center">Total Pengisian Presensi</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">
                    Tidak ada data pengguna yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            u.role === "ADMIN"
                              ? "bg-blue-100 text-blue-700"
                              : u.role === "GURU"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{u.name}</p>
                          <p className="text-[11px] text-slate-400">@{u.username || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          u.role === "ADMIN"
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : u.role === "GURU"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                        }`}
                      >
                        {u.role === "ADMIN" ? (
                          <span className="font-bold">Admin</span>
                        ) : u.role === "GURU" ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>Guru Pendidik</span>
                          </>
                        ) : (
                          <>
                            <GraduationCap className="w-3 h-3" />
                            <span>Siswa (Murid)</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-slate-700">
                        {u.role === "ADMIN" ? "Administrator" : u.role === "MURID" ? u.kelas || "-" : "Tenaga Pengajar"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="text-slate-700 font-medium">{u.phone || "-"}</p>
                      <p className="text-[10px] text-slate-400">{u.email || "-"}</p>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="inline-block px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs">
                        {u._count?.attendances ?? 0} kali
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition"
                          title="Edit Pengguna"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                          title="Hapus Pengguna"
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

        {/* Pagination Controls (5 per slide / halaman) */}
        {filteredUsers.length > itemsPerPage && (
          <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{(safePage - 1) * itemsPerPage + 1}</span> -{" "}
              <span className="font-bold text-slate-800">
                {Math.min(safePage * itemsPerPage, filteredUsers.length)}
              </span>{" "}
              dari <span className="font-bold text-slate-800">{filteredUsers.length}</span> pengguna
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
      </div>

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-800">
                {editingUser ? "Edit Data Pengguna" : "Tambah Pengguna Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Peran (Role):</label>
                <div className={`grid ${isSuperadmin ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "MURID" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      formData.role === "MURID"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    Siswa (Murid)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "GURU" })}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      formData.role === "GURU"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    Guru Pendidik
                  </button>
                  {/* Pilihan Role Admin Khusus Superadmin */}
                  {isSuperadmin && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: "ADMIN" })}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        formData.role === "ADMIN"
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      Admin
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Pratama"
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 font-medium rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username:</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="budi_pratama"
                    className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 font-medium rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon:</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 font-medium rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email (Opsional):</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="budi@example.com"
                    className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 font-medium rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                {formData.role === "MURID" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kelas:</label>
                    <input
                      type="text"
                      value={formData.kelas}
                      onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                      placeholder="XII RPL 1"
                      className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 font-medium rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editingUser ? "Kata Sandi Baru (Kosongkan jika tidak diubah):" : "Kata Sandi Akun:"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "Biarkan kosong bila tidak ingin ganti" : "Minimal 8 karakter unik..."}
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 font-medium rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-800 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Indikator Checklist Ketentuan Kata Sandi */}
                {(!editingUser || formData.password.length > 0) && (
                  <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-[11px] text-slate-600">
                    <p className="font-bold text-slate-700 mb-1.5">Ketentuan Kata Sandi:</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                        {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                        <span>Minimal 8 karakter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                        {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                        <span>Huruf besar (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasLowercase ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                        {hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                        <span>Huruf kecil (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                        {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                        <span>Angka (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 col-span-2 ${hasSymbol ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                        {hasSymbol ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                        <span>Simbol unik (@$!%*?&)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingUser ? "Simpan Perubahan" : "Tambahkan Pengguna"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-800">Import Data Pengguna (Excel)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Anda dapat menambahkan banyak Murid & Guru sekaligus dengan mengunggah file spreadsheet (.xlsx atau .xls).
              </p>
              <a
                href="/api/excel/import?mode=template"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-2"
              >
                <FileDown className="w-3.5 h-3.5" /> Download Template Format Excel
              </a>
            </div>

            <form onSubmit={handleImportExcel} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  required
                  id="excel-file-input"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="excel-file-input" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    {importFile ? importFile.name : "Klik untuk memilih file Excel"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Mendukung format .xlsx dan .xls</p>
                </label>
              </div>

              {importResult && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-800">
                    Hasil: Berhasil diimpor {importResult.imported}, dilewati {importResult.skipped}
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="max-h-24 overflow-y-auto text-[10px] text-rose-600">
                      {importResult.errors.map((err, i) => (
                        <p key={i}>• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={importLoading || !importFile}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {importLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Mulai Import</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

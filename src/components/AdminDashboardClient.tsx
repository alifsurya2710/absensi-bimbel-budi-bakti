"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import UserManagementSection from "@/components/UserManagementSection";
import AdminAttendanceApprovalTable from "@/components/AdminAttendanceApprovalTable";
import EditProfileModal from "@/components/EditProfileModal";
import NotificationManager from "@/components/NotificationManager";
import {
  Users,
  CheckSquare,
  LayoutDashboard,
  ChevronLeft,
  UserCheck2,
  LogOut,
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

interface AdminDashboardClientProps {
  currentUserRole: "SUPERADMIN" | "ADMIN";
  formattedUsers: UserItem[];
  formattedAttendances: AttendanceRecord[];
  overviewContent: React.ReactNode;
  user?: {
    id: string;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    phone?: string | null;
    role: "SUPERADMIN" | "ADMIN";
    image?: string | null;
  };
}

export default function AdminDashboardClient({
  currentUserRole,
  formattedUsers,
  formattedAttendances,
  overviewContent,
  user,
}: AdminDashboardClientProps) {
  // Mobile Tab: "dashboard" (overview & stats), "users" (Manajemen Murid & Guru), "approval" (Persetujuan Presensi)
  const [mobileTab, setMobileTab] = useState<"dashboard" | "users" | "approval">("dashboard");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#approval") {
        setMobileTab("approval");
      }
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="relative pb-20 sm:pb-0">
      {/* ========================================================= */}
      {/* 1. TAMPILAN DESKTOP (sm: / lg:): TETAP SEPERTI SEMULA     */}
      {/* ========================================================= */}
      <div className="hidden sm:block space-y-6 sm:space-y-8">
        {overviewContent}
        <UserManagementSection
          initialUsers={formattedUsers}
          currentUserRole={currentUserRole}
        />
        <AdminAttendanceApprovalTable
          initialAttendances={formattedAttendances}
          users={formattedUsers}
        />
      </div>

      {/* ========================================================= */}
      {/* 2. TAMPILAN MOBILE (sm:hidden): HALAMAN TERPISAH DENGAN NAVIGASI */}
      {/* ========================================================= */}
      <div className="sm:hidden">
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {mobileTab === "dashboard" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Mobile dengan Profil & Lonceng Notifikasi */}
            <div className="flex items-center justify-between bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-sky-100 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 leading-tight">
                    {user?.name || "Administrator"}
                  </h3>
                  <p className="text-[10px] text-sky-600 font-bold uppercase tracking-wider">
                    {currentUserRole}
                  </p>
                </div>
              </div>
              <NotificationManager
                currentUserRole={currentUserRole}
                onNavigateToApproval={() => {
                  setMobileTab("approval");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>

            {overviewContent}
          </div>
        )}

        {/* TAB 2: MANAJEMEN DATA MURID & GURU (HALAMAN SENDIRI) */}
        {mobileTab === "users" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Kembali ke Dashboard */}
            <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setMobileTab("dashboard");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                aria-label="Kembali ke Dashboard"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                  Manajemen Data Murid &amp; Guru
                </h2>
                <p className="text-[10px] text-slate-500">
                  CRUD Akun &amp; Ekspor Rekapitulasi Excel
                </p>
              </div>
            </div>

            <UserManagementSection
              initialUsers={formattedUsers}
              currentUserRole={currentUserRole}
            />
          </div>
        )}

        {/* TAB 3: PERSETUJUAN & MONITORING PRESENSI (HALAMAN SENDIRI) */}
        {mobileTab === "approval" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Kembali ke Dashboard */}
            <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setMobileTab("dashboard");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                aria-label="Kembali ke Dashboard"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                  Persetujuan &amp; Monitoring Presensi
                </h2>
                <p className="text-[10px] text-slate-500">
                  Verifikasi Selfie &amp; Approval Status
                </p>
              </div>
            </div>

            <AdminAttendanceApprovalTable
              initialAttendances={formattedAttendances}
              users={formattedUsers}
            />
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. MOBILE BOTTOM NAVIGATION (HANYA MUNCUL DI MOBILE / SM:HIDDEN) */}
      {/* ========================================================= */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-2xl border-t border-sky-200/70 px-2 py-2.5 shadow-[0_-8px_30px_rgba(56,189,248,0.15)] safe-area-pb">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* 1. Akun (Edit Profil) */}
          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl text-slate-500 hover:text-slate-800 transition"
          >
            <UserCheck2 className="w-5 h-5 text-sky-600 stroke-[1.8]" />
            <span className="text-[10px] font-medium tracking-tight">Akun</span>
          </button>

          {/* 2. Dashboard Tab */}
          <button
            type="button"
            onClick={() => {
              setMobileTab("dashboard");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
              mobileTab === "dashboard"
                ? "text-sky-600 font-black scale-105 bg-sky-50 shadow-xs"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] tracking-tight">Dashboard</span>
          </button>

          {/* 3. Murid & Guru Tab */}
          <button
            type="button"
            onClick={() => {
              setMobileTab("users");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
              mobileTab === "users"
                ? "text-sky-600 font-black scale-105 bg-sky-50 shadow-xs"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <Users className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] tracking-tight">Murid &amp; Guru</span>
          </button>

          {/* 4. Persetujuan / Approval Tab */}
          <button
            type="button"
            onClick={() => {
              setMobileTab("approval");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
              mobileTab === "approval"
                ? "text-emerald-600 font-black scale-105 bg-emerald-50 shadow-xs"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <CheckSquare className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] tracking-tight">Approval</span>
          </button>

          {/* 5. Keluar / Logout */}
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

      {/* Modal Edit Profil Mandiri untuk Admin / Superadmin via Bottom Nav */}
      {user && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          user={{
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role,
            image: user.image,
          }}
          onProfileUpdated={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

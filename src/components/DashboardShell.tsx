"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import AttendanceNotificationBell from "@/components/AttendanceNotificationBell";
import EditProfileModal from "@/components/EditProfileModal";
import {
  Users,
  LogOut,
  ShieldAlert,
  ChevronRight,
  Menu,
  X,
  UserCheck2,
  Sun,
  Moon,
} from "lucide-react";

interface DashboardShellClientProps {
  children: React.ReactNode;
  activeRole: "SUPERADMIN" | "ADMIN";
  title: string;
  user: {
    id?: string;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    image?: string | null;
  };
}

export default function DashboardShell({
  children,
  activeRole,
  title,
  user: initialUser,
}: DashboardShellClientProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem("dashboard_theme");
      if (saved === "dark") {
        setIsDarkMode(true);
      }
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("dashboard_theme", isDarkMode ? "dark" : "light");
    }
  }, [isDarkMode, mounted]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const roleColors = {
    SUPERADMIN: {
      badge: "bg-rose-100 text-rose-700 border-rose-200",
      accent: "from-rose-600 to-rose-700",
      avatar: "bg-rose-500",
    },
    ADMIN: {
      badge: "bg-teal-100 text-teal-700 border-teal-200",
      accent: "from-teal-600 to-emerald-700",
      avatar: "bg-teal-500",
    },
  };

  const navLinks = [
    {
      role: "SUPERADMIN",
      name: "Dashboard Superadmin",
      href: "/dashboard/superadmin",
      icon: ShieldAlert,
    },
    {
      role: "ADMIN",
      name: "Dashboard Admin",
      href: "/dashboard/admin",
      icon: Users,
    },
  ];

  // Filter: hanya tampilkan menu yang sesuai role
  const userRole = currentUser.role || activeRole;
  const visibleLinks = navLinks.filter((item) => item.role === userRole);
  const currentTheme = roleColors[activeRole];

  return (
    <div className={`min-h-screen font-sans flex flex-col lg:flex-row transition-colors duration-200 ${isDarkMode ? "dark-theme bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      {/* Mobile Top App Bar */}
      <header className={`lg:hidden sticky top-0 z-30 px-4 h-16 flex items-center justify-between shadow-xs border-b transition-colors ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 -ml-1 rounded-xl transition ${isDarkMode ? "text-slate-300 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Image
            src="/logo-forsiremis.png"
            alt="Logo FORSIREMIS"
            width={32}
            height={32}
            className="rounded-lg object-cover shadow-xs"
          />
          <span className={`font-bold text-xs sm:text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}>FORSIREMIS</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Lonceng Notifikasi Mobile */}
          <AttendanceNotificationBell currentUserRole={activeRole} hidePermissionBanner={false} />

          {/* Theme Toggle Button Mobile */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition ${isDarkMode ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"}`}
            title={isDarkMode ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${currentTheme.badge}`}>
            {activeRole}
          </span>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Responsive: sliding drawer on mobile, static on desktop) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 border-r flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}
      >
        {/* Brand */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
          <div className="flex items-center gap-3">
            <Image
              src="/logo-forsiremis.png"
              alt="Logo FORSIREMIS"
              width={40}
              height={40}
              className="rounded-xl object-cover shadow-sm"
            />
            <div>
              <h1 className={`text-base font-bold leading-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}>FORSIREMIS</h1>
              <p className="text-xs text-slate-400 font-medium">Panel Manajemen Presensi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className={`p-4 mx-4 my-4 rounded-2xl border flex flex-col gap-3 ${isDarkMode ? "bg-slate-800/80 border-slate-700/80" : "bg-slate-50 border-slate-100"}`}>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {currentUser.image ? (
                <div className="relative w-11 h-11 rounded-full overflow-hidden shadow-sm border-2 border-white ring-2 ring-slate-200">
                  <Image
                    src={currentUser.image}
                    alt={currentUser.name || "Foto Profil"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className={`w-11 h-11 rounded-full ${currentTheme.avatar} text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0`}>
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                {currentUser.name || "Administrator"}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {currentUser.username ? `@${currentUser.username}` : currentUser.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsEditProfileOpen(true);
            }}
            className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition shadow-2xs ${isDarkMode ? "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"}`}
          >
            <UserCheck2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Edit Profil Saya</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="px-4 flex-1 space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Panel Kontrol Administrator
          </p>
          {visibleLinks.map((item) => {
            const Icon = item.icon;
            const isActive = item.role === activeRole;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-slate-400" />}
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className={`p-4 border-t ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition ${isDarkMode ? "text-rose-400 hover:bg-rose-950/40 hover:text-rose-300" : "text-red-600 hover:bg-red-50 hover:text-red-700"}`}
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        {/* Desktop Header */}
        <header className={`hidden lg:flex h-16 border-b px-8 items-center justify-between sticky top-0 z-20 shadow-xs transition-colors ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          <div className="flex items-center gap-3.5">
            {/* Theme Toggle Button Desktop */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                isDarkMode
                  ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
              title={isDarkMode ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span>Mode Gelap</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-2xs ${
                isDarkMode
                  ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <UserCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Edit Profil</span>
            </button>

            <AttendanceNotificationBell currentUserRole={activeRole} hidePermissionBanner={true} />
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${currentTheme.badge}`}
            >
              {activeRole}
            </span>
            <span className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-slate-400"}`}>
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Page Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">{children}</main>
      </div>

      {/* Modal Edit Profil Mandiri untuk Admin / Superadmin */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={{
          id: currentUser.id || "",
          name: currentUser.name,
          username: currentUser.username,
          email: currentUser.email,
          phone: currentUser.phone,
          role: activeRole,
          image: currentUser.image,
        }}
        onProfileUpdated={(updated) => {
          setCurrentUser((prev) => ({
            ...prev,
            ...updated,
          }));
          router.refresh();
        }}
      />
    </div>
  );
}


import DashboardShell from "@/components/DashboardShell";
import AdminDashboardClient from "@/components/AdminDashboardClient";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ShieldAlert, Users, Activity, KeyRound, Database } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  const session = await auth();
  const [totalUsers, totalSuperadmins, totalAdmins, totalGuru, totalMurid, totalAttendances] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "SUPERADMIN" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "GURU" } }),
      prisma.user.count({ where: { role: "MURID" } }),
      prisma.attendance.count(),
    ]);

  const [managedUsers, recentAttendances] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "GURU", "MURID"] },
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        kelas: true,
        createdAt: true,
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.attendance.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const formattedUsers = managedUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  const formattedAttendances = recentAttendances.map((a) => ({
    id: a.id,
    status: a.status,
    approvalStatus: a.approvalStatus as "PENDING" | "APPROVED" | "REJECTED",
    rejectionReason: a.rejectionReason,
    notes: a.notes,
    photo: a.photo,
    createdAt: a.createdAt.toISOString(),
    user: {
      id: a.user.id,
      name: a.user.name,
      username: a.user.username,
      role: a.user.role,
      kelas: a.user.kelas,
      phone: a.user.phone,
    },
  }));

  const dbUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          kelas: true,
          image: true,
        },
      })
    : null;

  const overviewContent = (
    <div className="space-y-6 sm:space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <ShieldAlert className="w-3.5 h-3.5" /> Akses Penuh Sistem
          </span>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Portal Super Administrator</h1>
          <p className="mt-2 text-rose-100 text-sm leading-relaxed">
            Kelola pengguna (CRUD Murid & Guru), persetujuan presensi, notifikasi langsung, serta ekspor & impor data Excel terpusat.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-10 opacity-15">
          <ShieldAlert className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total Akun</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-800">{totalUsers}</p>
          <p className="mt-1 text-xs text-slate-400">Terdaftar di database</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Administrator</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-800">{totalAdmins + totalSuperadmins}</p>
          <p className="mt-1 text-xs text-blue-600 font-medium">{totalSuperadmins} Superadmin • {totalAdmins} Admin</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Guru & Siswa</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-800">{totalGuru + totalMurid}</p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">{totalGuru} Guru • {totalMurid} Murid</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total Log Absensi</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-800">{totalAttendances}</p>
          <p className="mt-1 text-xs text-purple-600 font-medium">Record tersimpan</p>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardShell
      activeRole="SUPERADMIN"
      title="Ringkasan Sistem & Kontrol Tingkat Tinggi"
      user={{
        id: dbUser?.id || session?.user?.id || "",
        name: dbUser?.name || session?.user?.name,
        username: dbUser?.username || "",
        email: dbUser?.email || session?.user?.email,
        phone: dbUser?.phone || "",
        role: "SUPERADMIN",
        image: dbUser?.image || null,
      }}
    >
      <AdminDashboardClient
        currentUserRole="SUPERADMIN"
        formattedUsers={formattedUsers}
        formattedAttendances={formattedAttendances}
        overviewContent={overviewContent}
        user={{
          id: dbUser?.id || session?.user?.id || "",
          name: dbUser?.name || session?.user?.name,
          username: dbUser?.username || "",
          email: dbUser?.email || session?.user?.email,
          phone: dbUser?.phone || "",
          role: "SUPERADMIN",
          image: dbUser?.image || null,
        }}
      />
    </DashboardShell>
  );
}

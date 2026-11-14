import DashboardShell from "@/components/DashboardShell";
import AdminDashboardClient from "@/components/AdminDashboardClient";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Users, GraduationCap, UserCheck, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await auth();
  const [muridCount, guruCount, attendancesList, managedUsers] = await Promise.all([
    prisma.user.count({ where: { role: "MURID" } }),
    prisma.user.count({ where: { role: "GURU" } }),
    prisma.attendance.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["GURU", "MURID"] },
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
  ]);

  const formattedUsers = managedUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  const formattedAttendances = attendancesList.map((a) => ({
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <Users className="w-3.5 h-3.5" /> Portal Staf Administrasi
          </span>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Pusat Monitoring Kehadiran</h1>
          <p className="mt-2 text-blue-100 text-sm leading-relaxed">
            Kelola data akun siswa dan guru, lakukan verifikasi/approval kehadiran selfie, dan pantau rekapitulasi data Excel secara mudah.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-10 opacity-15">
          <GraduationCap className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Jumlah Siswa Bimbel</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-800">{muridCount}</p>
          <p className="mt-1 text-xs text-slate-400">Siswa aktif terdaftar</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Jumlah Guru / Tutor</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-800">{guruCount}</p>
          <p className="mt-1 text-xs text-slate-400">Tenaga pengajar aktif</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Log Presensi Terkini</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-800">{attendancesList.length}</p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Record presensi terbaru</p>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardShell
      activeRole="ADMIN"
      title="Manajemen Presensi Bimbel BUDI BAKTI"
      user={{
        id: dbUser?.id || session?.user?.id || "",
        name: dbUser?.name || session?.user?.name,
        username: dbUser?.username || "",
        email: dbUser?.email || session?.user?.email,
        phone: dbUser?.phone || "",
        role: "ADMIN",
        image: dbUser?.image || null,
      }}
    >
      <AdminDashboardClient
        currentUserRole="ADMIN"
        formattedUsers={formattedUsers}
        formattedAttendances={formattedAttendances}
        overviewContent={overviewContent}
        user={{
          id: dbUser?.id || session?.user?.id || "",
          name: dbUser?.name || session?.user?.name,
          username: dbUser?.username || "",
          email: dbUser?.email || session?.user?.email,
          phone: dbUser?.phone || "",
          role: "ADMIN",
          image: dbUser?.image || null,
        }}
      />
    </DashboardShell>
  );
}

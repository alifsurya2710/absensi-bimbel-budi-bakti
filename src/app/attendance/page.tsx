import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AttendanceClient from "@/components/AttendanceClient";

export default async function AttendancePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Jika superadmin / admin yang membuka, alihkan ke dashboard admin
  if (session.user.role === "SUPERADMIN") {
    redirect("/dashboard/superadmin");
  }
  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  // Ambil data profil dan riwayat presensi user ini
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const attendances = await prisma.attendance.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const formattedHistory = attendances.map((item) => ({
    id: item.id,
    status: item.status as "HADIR" | "BELUM_HADIR" | "IZIN" | "SAKIT" | "TIDAK_HADIR",
    approvalStatus: item.approvalStatus as "PENDING" | "APPROVED" | "REJECTED",
    rejectionReason: item.rejectionReason,
    notes: item.notes,
    photo: item.photo,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <AttendanceClient
      user={{
        id: user?.id || session.user.id,
        name: user?.name,
        username: user?.username,
        email: user?.email,
        role: session.user.role as "GURU" | "MURID",
        kelas: user?.kelas,
        phone: user?.phone,
        image: user?.image,
      }}
      initialHistory={formattedHistory}
    />
  );
}


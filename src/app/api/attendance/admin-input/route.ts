import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";

// POST /api/attendance/admin-input
// Superadmin / Admin mengisi presensi atas nama guru atau murid (alpa manual)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (
      !session?.user?.id ||
      (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, status, notes, date } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: "userId dan status wajib diisi." },
        { status: 400 }
      );
    }

    const validStatuses: AttendanceStatus[] = [
      AttendanceStatus.HADIR,
      AttendanceStatus.BELUM_HADIR,
      AttendanceStatus.IZIN,
      AttendanceStatus.SAKIT,
      AttendanceStatus.TIDAK_HADIR,
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status kehadiran tidak valid." },
        { status: 400 }
      );
    }

    // Pastikan target user adalah GURU atau MURID
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    if (targetUser.role !== "GURU" && targetUser.role !== "MURID") {
      return NextResponse.json(
        { error: "Hanya bisa mengisi presensi untuk GURU atau MURID." },
        { status: 400 }
      );
    }

    // Tanggal: pakai tanggal yang dikirim atau hari ini
    const attendanceDate = date ? new Date(date) : new Date();

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        status,
        notes: notes ? String(notes).trim() : `Diisi oleh ${session.user.role} (${session.user.name || "Admin"})`,
        photo: null,
        date: attendanceDate,
        // Langsung APPROVED karena diisi oleh admin
        approvalStatus: "APPROVED",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            kelas: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: `Presensi ${targetUser.name} berhasil dicatat sebagai ${status}.`,
        attendance: {
          id: attendance.id,
          status: attendance.status,
          approvalStatus: attendance.approvalStatus,
          rejectionReason: attendance.rejectionReason,
          notes: attendance.notes,
          photo: attendance.photo,
          createdAt: attendance.createdAt.toISOString(),
          user: attendance.user,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin input attendance error:", error);
    return NextResponse.json(
      { error: "Terjadi gangguan saat menyimpan data presensi." },
      { status: 500 }
    );
  }
}



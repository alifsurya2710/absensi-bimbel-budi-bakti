import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";

// GET /api/parent-attendance - Ambil riwayat absensi orang tua
// - Jika Murid: ambil data orang tua murid bersangkutan
// - Jika Admin / Superadmin: ambil semua data absensi orang tua beserta relasi murid
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const isStaff = session.user.role === "SUPERADMIN" || session.user.role === "ADMIN";

    const whereClause = isStaff ? {} : { studentId: session.user.id };

    const records = await prisma.parentAttendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            username: true,
            kelas: true,
            image: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("GET /api/parent-attendance error:", error);
    return NextResponse.json({ error: "Gagal memuat absensi orang tua" }, { status: 500 });
  }
}

// POST /api/parent-attendance - Murid / Wali mengisi absensi kunjungan orang tua
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const body = await req.json();
    const { parentName, parentPhone, status, notes } = body;

    if (!parentName || !parentName.trim()) {
      return NextResponse.json({ error: "Nama orang tua / wali wajib diisi." }, { status: 400 });
    }

    if (!parentPhone || !parentPhone.trim()) {
      return NextResponse.json({ error: "Nomor telepon orang tua wajib diisi." }, { status: 400 });
    }

    const validStatuses: AttendanceStatus[] = [
      "HADIR",
      "BELUM_HADIR",
      "IZIN",
      "SAKIT",
      "TIDAK_HADIR",
    ];

    const selectedStatus: AttendanceStatus = validStatuses.includes(status) ? status : "HADIR";

    const newRecord = await prisma.parentAttendance.create({
      data: {
        studentId: session.user.id,
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        status: selectedStatus,
        notes: notes ? notes.trim() : null,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            username: true,
            kelas: true,
            image: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Absensi orang tua berhasil dicatat!",
      record: newRecord,
    });
  } catch (error) {
    console.error("POST /api/parent-attendance error:", error);
    return NextResponse.json({ error: "Gagal menyimpan absensi orang tua" }, { status: 500 });
  }
}


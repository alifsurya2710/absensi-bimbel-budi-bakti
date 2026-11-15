import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/attendance/notifications - Cek presensi terbaru (untuk admin/superadmin)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");

    const whereClause: { createdAt?: { gt: Date } } = {};
    if (since) {
      whereClause.createdAt = { gt: new Date(since) };
    }

    const recentAttendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            kelas: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const pendingCount = await prisma.attendance.count({
      where: { approvalStatus: "PENDING" },
    });

    return NextResponse.json({
      attendances: recentAttendances,
      pendingCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/attendance/notifications error:", error);
    return NextResponse.json({ error: "Gagal memuat notifikasi" }, { status: 500 });
  }
}



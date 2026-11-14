import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/attendance/user-status - Cek status presensi terbaru user login (untuk notifikasi reject realtime)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const latest = await prisma.attendance.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!latest) {
      return NextResponse.json({ latest: null });
    }

    return NextResponse.json({
      latest: {
        id: latest.id,
        status: latest.status,
        approvalStatus: latest.approvalStatus,
        rejectionReason: latest.rejectionReason,
        notes: latest.notes,
        createdAt: latest.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/attendance/user-status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


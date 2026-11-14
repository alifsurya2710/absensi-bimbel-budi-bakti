import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApprovalStatus } from "@prisma/client";

// PATCH /api/attendance/[id]/approval - Approve / Reject Attendance
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { approvalStatus, rejectionReason } = body;

    if (!approvalStatus || !["APPROVED", "REJECTED", "PENDING"].includes(approvalStatus)) {
      return NextResponse.json({ error: "Status approval tidak valid." }, { status: 400 });
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        approvalStatus: approvalStatus as ApprovalStatus,
        rejectionReason: approvalStatus === "REJECTED" ? (rejectionReason || "Ditolak oleh admin") : null,
      },
      include: {
        user: {
          select: { name: true, role: true },
        },
      },
    });

    return NextResponse.json({
      message: `Presensi berhasil ${approvalStatus === "APPROVED" ? "disetujui" : "ditolak"}!`,
      attendance,
    });
  } catch (error) {
    console.error("PATCH /api/attendance/[id]/approval error:", error);
    return NextResponse.json({ error: "Gagal memproses persetujuan" }, { status: 500 });
  }
}


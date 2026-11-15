import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/attendance/[id] - Hapus Record Presensi
// Diizinkan untuk:
// 1. Superadmin & Admin (bebas hapus siapa saja)
// 2. Pemilik presensi itu sendiri (role MURID / GURU)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const { id } = await params;

    // Pastikan data presensi ada
    const existing = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Data presensi tidak ditemukan" }, { status: 404 });
    }

    const userRole = session.user.role;
    const isOwner = existing.userId === session.user.id;
    const isAdminOrSuperadmin = userRole === "SUPERADMIN" || userRole === "ADMIN";

    // Jika bukan Admin/Superadmin dan bukan pemiliknya sendiri, tolak
    if (!isAdminOrSuperadmin && !isOwner) {
      return NextResponse.json({ error: "Anda tidak berhak menghapus presensi ini." }, { status: 403 });
    }

    // Hapus presensi dari database
    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Data presensi berhasil dihapus permanen.",
    });
  } catch (error) {
    console.error("DELETE /api/attendance/[id] error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data presensi dari server" },
      { status: 500 }
    );
  }
}

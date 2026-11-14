import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications - Ambil daftar notifikasi untuk pengguna yang sedang login
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Superadmin dan Admin yang memiliki akses pusat notifikasi." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const whereRecipient: { userId: string; isRead?: boolean } = {
      userId: session.user.id,
    };
    if (unreadOnly) {
      whereRecipient.isRead = false;
    }

    const [recipients, unreadCount] = await Promise.all([
      prisma.notificationRecipient.findMany({
        where: whereRecipient,
        include: {
          notification: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      }),
      prisma.notificationRecipient.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    ]);

    const notifications = recipients.map((r) => ({
      id: r.notification.id,
      recipientId: r.id,
      title: r.notification.title,
      message: r.notification.message,
      senderId: r.notification.senderId,
      senderName: r.notification.senderName,
      senderRole: r.notification.senderRole,
      status: r.notification.status,
      kelas: r.notification.kelas,
      notes: r.notification.notes,
      attendanceId: r.notification.attendanceId,
      isRead: r.isRead,
      readAt: r.readAt,
      createdAt: r.notification.createdAt,
    }));

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Gagal memuat notifikasi" }, { status: 500 });
  }
}

// PATCH /api/notifications - Tandai notifikasi sebagai sudah dibaca (tunggal atau semua)
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await prisma.notificationRecipient.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ message: "Semua notifikasi telah ditandai sudah dibaca." });
    }

    if (notificationId) {
      await prisma.notificationRecipient.updateMany({
        where: {
          notificationId,
          userId: session.user.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ message: "Notifikasi telah ditandai dibaca." });
    }

    return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status notifikasi" }, { status: 500 });
  }
}


import * as webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { Role, AttendanceStatus } from "@prisma/client";

// Konfigurasi VAPID Keys
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@budibakti.sch.id";

if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (err) {
    console.error("Gagal menginisialisasi Web Push VAPID:", err);
  }
}

export interface SendPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, unknown>;
}

/**
 * Dispatch notifikasi ke database & Web Push ke seluruh perangkat Superadmin & Admin
 */
export async function createAndDispatchNotification({
  title,
  message,
  senderId,
  senderName,
  senderRole,
  status,
  kelas,
  notes,
  attendanceId,
}: {
  title: string;
  message: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  status: AttendanceStatus;
  kelas?: string | null;
  notes?: string | null;
  attendanceId?: string | null;
}) {
  try {
    // 1. Dapatkan semua Superadmin & Admin aktif selain si pengirim itu sendiri
    const adminUsers = await prisma.user.findMany({
      where: {
        role: { in: ["SUPERADMIN", "ADMIN"] },
        id: { not: senderId },
      },
      select: {
        id: true,
        pushSubscriptions: true,
      },
    });

    if (adminUsers.length === 0) return null;

    // 2. Simpan Catatan Notifikasi ke Database Neon
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        senderId,
        senderName,
        senderRole,
        status,
        kelas: kelas || null,
        notes: notes || null,
        attendanceId: attendanceId || null,
        recipients: {
          create: adminUsers.map((u) => ({
            userId: u.id,
            isRead: false,
          })),
        },
      },
    });

    // 3. Persiapkan Payload Web Push Notification Handphone
    const pushPayload: SendPushPayload = {
      title,
      body: message,
      icon: "/logo-forsiremis.png",
      badge: "/logo-forsiremis.png",
      url: "/dashboard",
      data: {
        notificationId: notification.id,
        attendanceId: attendanceId || undefined,
        status,
        senderRole,
      },
    };

    const payloadString = JSON.stringify(pushPayload);

    // 4. Kirim Push Notification ke seluruh subscription yang terdaftar di database
    const sendPromises = adminUsers.flatMap((u) =>
      u.pushSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payloadString
          );
        } catch (error: unknown) {
          const err = error as { statusCode?: number };
          // Hapus subscription basi/kedaluwarsa (404 atau 410)
          if (err.statusCode === 404 || err.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      })
    );

    // Jalankan tanpa memblokir request utama
    Promise.allSettled(sendPromises).catch((err) => console.error("Error broadcast push:", err));

    return notification;
  } catch (error) {
    console.error("createAndDispatchNotification error:", error);
    return null;
  }
}

/**
 * Kirim Push Notification status Approval (Disetujui / Ditolak) langsung ke HP Murid atau Guru
 */
export async function sendApprovalPushNotification({
  targetUserId,
  approvalStatus,
  rejectionReason,
  statusLabel,
  approverName,
}: {
  targetUserId: string;
  approvalStatus: "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  statusLabel: string;
  approverName?: string;
}) {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        pushSubscriptions: true,
      },
    });

    if (!targetUser || targetUser.pushSubscriptions.length === 0) {
      return null;
    }

    const isApproved = approvalStatus === "APPROVED";
    const title = isApproved
      ? "✅ PRESENSI ANDA DISETUJUI!"
      : "❌ PRESENSI ANDA DITOLAK";

    const body = isApproved
      ? `Pengajuan presensi (${statusLabel}) Anda telah diverifikasi dan disetujui oleh ${approverName || "Admin"}.`
      : `Pengajuan presensi (${statusLabel}) Anda ditolak oleh ${approverName || "Admin"}.\nAlasan: ${rejectionReason || "Tidak sesuai ketentuan."}`;

    const payload: SendPushPayload = {
      title,
      body,
      icon: "/logo-forsiremis.png",
      badge: "/logo-forsiremis.png",
      url: "/attendance",
      data: {
        approvalStatus,
        rejectionReason: rejectionReason || null,
        targetUserId,
      },
    };

    const payloadString = JSON.stringify(payload);

    const promises = targetUser.pushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payloadString
        );
      } catch (error: unknown) {
        const err = error as { statusCode?: number };
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    });

    Promise.allSettled(promises).catch((err) =>
      console.error("Error sending approval push:", err)
    );

    return true;
  } catch (error) {
    console.error("sendApprovalPushNotification error:", error);
    return null;
  }
}




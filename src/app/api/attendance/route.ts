import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";
import { createAndDispatchNotification } from "@/lib/pushNotification";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Anda belum masuk." }, { status: 401 });
    }

    const body = await req.json();
    const { status, notes, photo } = body;

    // Status valid: HADIR, BELUM_HADIR, IZIN, SAKIT, TIDAK_HADIR
    const validStatuses: AttendanceStatus[] = [
      AttendanceStatus.HADIR,
      AttendanceStatus.BELUM_HADIR,
      AttendanceStatus.IZIN,
      AttendanceStatus.SAKIT,
      AttendanceStatus.TIDAK_HADIR,
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status kehadiran tidak valid." }, { status: 400 });
    }

    // Untuk status HADIR, IZIN, dan SAKIT: Wajib foto / selfie
    if ((status === "HADIR" || status === "IZIN" || status === "SAKIT") && !photo) {
      return NextResponse.json(
        { error: `Untuk status ${status}, Anda wajib mengambil foto / selfie sebagai bukti verifikasi.` },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: session.user.id,
        status,
        notes: notes ? String(notes).trim() : null,
        photo: photo ? String(photo) : null,
        date: new Date(),
      },
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
    });

    // Kirim notifikasi realtime & Push Notification jika yang mengisi adalah GURU atau MURID
    if (attendance.user.role === "MURID" || attendance.user.role === "GURU") {
      const isMurid = attendance.user.role === "MURID";
      const roleLabel = isMurid ? "Murid" : "Guru";
      const userName = attendance.user.name || attendance.user.username || "Pengguna";
      const kelasInfo = attendance.user.kelas ? ` [${attendance.user.kelas}]` : "";

      let notifTitle = `🔔 PRESENSI BARU - BIMBEL BUDI BAKTI`;
      let statusDesc = "Hadir";

      if (status === "IZIN") {
        notifTitle = `🔔 PENGAJUAN IZIN BARU`;
        statusDesc = "Izin";
      } else if (status === "SAKIT") {
        notifTitle = `🔔 PENGAJUAN SAKIT BARU`;
        statusDesc = "Sakit";
      } else if (status === "TIDAK_HADIR") {
        notifTitle = `🔔 PEMBERITAHUAN TIDAK HADIR`;
        statusDesc = "Tidak Hadir (Alpa)";
      }

      const notifTime = new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(new Date());

      const notifMessage = `Nama: ${userName}${kelasInfo}
Role: ${roleLabel}
Status: ${statusDesc}
Keterangan: ${attendance.notes || "Mengikuti kegiatan bimbingan belajar."}
Waktu: ${notifTime} WIB`;

      // Dispatch ke database dan push notification HP Admin / Superadmin
      createAndDispatchNotification({
        title: notifTitle,
        message: notifMessage,
        senderId: attendance.user.id,
        senderName: userName,
        senderRole: attendance.user.role,
        status,
        kelas: attendance.user.kelas,
        notes: attendance.notes,
        attendanceId: attendance.id,
      }).catch((e) => console.error("Dispatch notification error:", e));
    }

    return NextResponse.json(
      {
        message: "Presensi berhasil disimpan!",
        attendance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Attendance API error:", error);
    return NextResponse.json(
      { error: "Terjadi gangguan saat menyimpan data presensi." },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/push-subscription - Daftarkan atau perbarui subscription Web Push
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Superadmin dan Admin yang dapat mendaftarkan perangkat." }, { status: 403 });
    }

    const body = await req.json();
    const { subscription, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Subscription data tidak lengkap." }, { status: 400 });
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth: authKey } = keys;

    if (!p256dh || !authKey) {
      return NextResponse.json({ error: "Kunci enkripsi p256dh dan auth wajib ada." }, { status: 400 });
    }

    // Upsert subscription berdasarkan endpoint unik perangkat
    const saved = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: session.user.id,
        p256dh,
        auth: authKey,
        userAgent: userAgent || null,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh,
        auth: authKey,
        userAgent: userAgent || null,
      },
    });

    return NextResponse.json({
      message: "Perangkat berhasil didaftarkan untuk menerima Push Notification!",
      subscriptionId: saved.id,
    });
  } catch (error) {
    console.error("POST /api/push-subscription error:", error);
    return NextResponse.json({ error: "Gagal menyimpan push subscription" }, { status: 500 });
  }
}

// DELETE /api/push-subscription - Hapus subscription (misal saat logout atau mematikan notifikasi)
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint diperlukan" }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: "Subscription berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/push-subscription error:", error);
    return NextResponse.json({ error: "Gagal menghapus push subscription" }, { status: 500 });
  }
}


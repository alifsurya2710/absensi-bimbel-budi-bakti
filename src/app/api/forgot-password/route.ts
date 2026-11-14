import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpPasswordEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Silakan masukkan alamat Gmail / email Anda." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Cari pengguna berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Alamat email tidak terdaftar dalam sistem." },
        { status: 404 }
      );
    }

    // 2. Buat kode OTP 6 digit angka
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Berlaku 15 Menit

    // Hapus token lama jika ada, lalu simpan kode OTP baru
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordResetToken.create({
      data: {
        token: otpCode,
        userId: user.id,
        expiresAt,
      },
    });

    // 3. Kirim email OTP
    const emailResult = await sendOtpPasswordEmail(
      user.email || cleanEmail,
      otpCode,
      user.name || "Pengguna"
    );

    return NextResponse.json(
      {
        message: `Kode OTP 6 digit telah dikirimkan ke ${cleanEmail}`,
        email: cleanEmail,
        otpDemo: process.env.NODE_ENV !== "production" ? otpCode : undefined,
        previewUrl: emailResult.previewUrl || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses pengiriman kode OTP." },
      { status: 500 }
    );
  }
}

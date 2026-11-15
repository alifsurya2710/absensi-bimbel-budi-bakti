import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, kode OTP, dan kata sandi baru wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // 1. Validasi Kriteria Password Baru
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        { error: passwordCheck.message },
        { status: 400 }
      );
    }

    // 2. Cari pengguna
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // 3. Verifikasi kode OTP di PasswordResetToken
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        token: cleanOtp,
      },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Kode OTP salah atau tidak sesuai. Periksa kembali email Anda." },
        { status: 400 }
      );
    }

    // 4. Cek masa kedaluwarsa OTP
    if (new Date() > resetRecord.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
      return NextResponse.json(
        { error: "Kode OTP telah kedaluwarsa (lebih dari 15 menit). Silakan kirim ulang kode." },
        { status: 400 }
      );
    }

    // 5. Update kata sandi pengguna
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 6. Hapus token OTP setelah berhasil digunakan
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    return NextResponse.json(
      { message: "Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengatur ulang kata sandi." },
      { status: 500 }
    );
  }
}



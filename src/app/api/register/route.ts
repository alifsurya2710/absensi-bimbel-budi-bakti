import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/validators";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, email, phone, password, role, kelas, image } = body;

    // 1. Validasi field wajib
    if (!name || !username || !email || !phone || !password || !role) {
      return NextResponse.json(
        { error: "Nama, username, email, nomor telepon, kata sandi, dan peran wajib diisi." },
        { status: 400 }
      );
    }

    // 2. Batasi Role hanya untuk GURU dan MURID
    if (role !== "GURU" && role !== "MURID") {
      return NextResponse.json(
        { error: "Pendaftaran publik hanya dibuka untuk Guru dan Murid." },
        { status: 403 }
      );
    }

    // 3. Format username
    const cleanUsername = String(username).trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: "Username harus 3-20 karakter dan hanya boleh berisi huruf, angka, atau underscore." },
        { status: 400 }
      );
    }

    // 4. Format nomor telepon
    const cleanPhone = String(phone).trim().replace(/[^0-9+]/g, "");
    if (cleanPhone.length < 9 || cleanPhone.length > 15) {
      return NextResponse.json(
        { error: "Nomor telepon tidak valid (masukkan antara 9-15 digit angka)." },
        { status: 400 }
      );
    }

    // 5. Validasi format Password
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        { error: passwordCheck.message },
        { status: 400 }
      );
    }

    // 6. Cek ketersediaan username, email, dan nomor telepon
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase() },
          { username: cleanUsername },
          { phone: cleanPhone },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        return NextResponse.json(
          { error: "Username sudah digunakan, silakan pilih username lain." },
          { status: 409 }
        );
      }
      if (existingUser.email === email.trim().toLowerCase()) {
        return NextResponse.json(
          { error: "Alamat email sudah terdaftar." },
          { status: 409 }
        );
      }
      if (existingUser.phone === cleanPhone) {
        return NextResponse.json(
          { error: "Nomor telepon sudah terdaftar pada akun lain." },
          { status: 409 }
        );
      }
    }

    // 7. Hash password & simpan user baru
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        password: hashedPassword,
        role: role as Role,
        kelas: role === "MURID" && kelas ? String(kelas).trim() : null,
        image: image ? String(image) : null, // Foto profil opsional (Base64 data URL)
      },
    });

    return NextResponse.json(
      {
        message: "Pendaftaran berhasil! Silakan masuk.",
        userId: newUser.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat mendaftar." },
      { status: 500 }
    );
  }
}

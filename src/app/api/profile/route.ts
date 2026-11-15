import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/profile - Ambil data profil user saat ini
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        kelas: true,
        image: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Gagal memuat profil" }, { status: 500 });
  }
}

// PUT /api/profile - Update username, email, phone, password, image, name
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { name, username, email, phone, password, image, kelas } = body;

    // Cek duplikasi username jika diubah
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });
      if (existingUser) {
        return NextResponse.json({ error: "Username sudah digunakan oleh akun lain" }, { status: 400 });
      }
    }

    // Cek duplikasi email jika diubah
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });
      if (existingEmail) {
        return NextResponse.json({ error: "Alamat email sudah digunakan oleh akun lain" }, { status: 400 });
      }
    }

    // Cek duplikasi nomor telepon jika diubah
    if (phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone,
          NOT: { id: userId },
        },
      });
      if (existingPhone) {
        return NextResponse.json({ error: "Nomor telepon sudah digunakan oleh akun lain" }, { status: 400 });
      }
    }

    // Validasi password baru bila diisi
    let hashedPassword: string | undefined = undefined;
    if (password && password.trim() !== "") {
      const hasMinLength = password.length >= 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSymbol = /[@$!%*?&]/.test(password);

      if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
        return NextResponse.json(
          {
            error:
              "Kata sandi baru harus minimal 8 karakter, serta mengandung huruf besar, huruf kecil, angka, dan simbol (@$!%*?&)",
          },
          { status: 400 }
        );
      }

      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update profil ke database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(username !== undefined && { username: username || null }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(kelas !== undefined && { kelas: kelas || null }),
        ...(image !== undefined && { image: image || null }),
        ...(hashedPassword && { password: hashedPassword }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        kelas: true,
        image: true,
      },
    });

    return NextResponse.json({
      message: "Profil Anda berhasil diperbarui!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }
}



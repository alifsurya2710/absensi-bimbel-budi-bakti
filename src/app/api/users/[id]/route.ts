import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// PUT /api/users/[id] - Update User
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, username, email, phone, password, role, kelas } = body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    const isSuperadmin = session.user.role === "SUPERADMIN";

    if (targetUser.role === "SUPERADMIN" && !isSuperadmin) {
      return NextResponse.json({ error: "Anda tidak berhak mengubah Superadmin." }, { status: 403 });
    }

    if (targetUser.role === "ADMIN" && !isSuperadmin) {
      return NextResponse.json({ error: "Hanya Superadmin yang berhak mengubah data Admin." }, { status: 403 });
    }

    if (role === "SUPERADMIN" && targetUser.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Tidak dapat mengubah peran menjadi Superadmin." }, { status: 403 });
    }

    if (role === "ADMIN" && !isSuperadmin) {
      return NextResponse.json({ error: "Hanya Superadmin yang berhak menetapkan peran Admin." }, { status: 403 });
    }

    const updateData: {
      name?: string;
      username?: string;
      email?: string | null;
      phone?: string | null;
      password?: string;
      role?: Role;
      kelas?: string | null;
    } = {};

    if (name) updateData.name = name.trim();
    if (role && (role === "GURU" || role === "MURID" || (role === "ADMIN" && isSuperadmin))) {
      updateData.role = role as Role;
      if (role === "MURID" || role === "GURU") {
        updateData.kelas = kelas || targetUser.kelas || null;
      } else {
        updateData.kelas = null;
      }
    }

    if (username && username.toLowerCase().trim() !== targetUser.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: username.toLowerCase().trim() },
      });
      if (existingUser) {
        return NextResponse.json({ error: "Username sudah digunakan pengguna lain." }, { status: 400 });
      }
      updateData.username = username.toLowerCase().trim();
    }

    if (email !== undefined) {
      const cleanEmail = email ? email.toLowerCase().trim() : null;
      if (cleanEmail && cleanEmail !== targetUser.email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });
        if (existingEmail) {
          return NextResponse.json({ error: "Email sudah digunakan pengguna lain." }, { status: 400 });
        }
      }
      updateData.email = cleanEmail;
    }

    if (phone !== undefined) {
      updateData.phone = phone ? phone.trim() : null;
    }

    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: "Pengguna berhasil diperbarui!", user: updatedUser });
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui pengguna" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete User
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { id } = await params;
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    if (targetUser.role === "SUPERADMIN") {
      return NextResponse.json({ error: "Superadmin tidak dapat dihapus." }, { status: 403 });
    }

    if (targetUser.role === "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Hanya Superadmin yang dapat menghapus akun Admin." }, { status: 403 });
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json({ error: "Tidak dapat menghapus akun Anda sendiri." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "Pengguna berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus pengguna" }, { status: 500 });
  }
}


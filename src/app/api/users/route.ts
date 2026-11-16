import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// GET /api/users - Fetch users by role or all (Superadmin/Admin)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const isSuperadmin = session.user.role === "SUPERADMIN";

    const whereClause: { role?: Role | { in: Role[] } } = {};
    if (role === "ADMIN" && isSuperadmin) {
      whereClause.role = "ADMIN" as Role;
    } else if (role === "GURU" || role === "MURID") {
      whereClause.role = role as Role;
    } else {
      // Superadmin can view ADMIN, GURU, MURID. Regular Admin only views GURU, MURID
      whereClause.role = {
        in: isSuperadmin ? ["ADMIN", "GURU", "MURID"] : ["GURU", "MURID"],
      } as unknown as { in: Role[] };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
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
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Gagal memuat pengguna" }, { status: 500 });
  }
}

// POST /api/users - Create User (Guru / Murid)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { name, username, email, phone, password, role, kelas } = body;

    if (!name || !username || !password || !role) {
      return NextResponse.json({ error: "Nama, username, password, dan peran wajib diisi." }, { status: 400 });
    }

    const isSuperadmin = session.user.role === "SUPERADMIN";

    // Validasi Role yang boleh dibuat:
    // - SUPERADMIN bisa membuat ADMIN, GURU, MURID
    // - ADMIN HANYA bisa membuat GURU, MURID (TIDAK BISA membuat SUPERADMIN atau ADMIN)
    if (role === "SUPERADMIN") {
      return NextResponse.json({ error: "Tidak dapat membuat akun Superadmin baru." }, { status: 403 });
    }

    if (role === "ADMIN" && !isSuperadmin) {
      return NextResponse.json({ error: "Hanya Superadmin yang berhak menambahkan akun Admin." }, { status: 403 });
    }

    if (role !== "ADMIN" && role !== "GURU" && role !== "MURID") {
      return NextResponse.json({ error: "Peran tidak valid." }, { status: 400 });
    }

    // Check username
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });
    if (existingUsername) {
      return NextResponse.json({ error: "Username sudah digunakan." }, { status: 400 });
    }

    // Check email
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (existingEmail) {
        return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.toLowerCase().trim(),
        email: email ? email.toLowerCase().trim() : null,
        phone: phone ? phone.trim() : null,
        password: hashedPassword,
        role: role as Role,
        kelas: (role === "MURID" || role === "GURU") ? (kelas?.trim() || null) : null,
      },
    });

    return NextResponse.json({ message: "Pengguna berhasil ditambahkan!", user: newUser });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Gagal menambahkan pengguna" }, { status: 500 });
  }
}



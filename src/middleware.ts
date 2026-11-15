import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  // 1. Proteksi Halaman Dashboard (HANYA SUPERADMIN & ADMIN)
  if (pathname.startsWith("/dashboard")) {
    if (!session || !role) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Jika Murid atau Guru mencoba membuka dashboard, lempar ke /attendance
    if (role === "MURID" || role === "GURU") {
      return NextResponse.redirect(new URL("/attendance", req.url));
    }

    // Hanya Superadmin yang boleh buka dashboard superadmin
    if (pathname.startsWith("/dashboard/superadmin") && role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }

    // Hanya Admin yang boleh buka dashboard admin
    if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
      if (role === "SUPERADMIN") {
        return NextResponse.redirect(new URL("/dashboard/superadmin", req.url));
      }
      return NextResponse.redirect(new URL("/attendance", req.url));
    }
  }

  // 2. Proteksi Halaman Presensi /attendance (Khusus Murid & Guru)
  if (pathname.startsWith("/attendance")) {
    if (!session || !role) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Jika Superadmin / Admin membuka attendance, arahkan ke dashboard mereka
    if (role === "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard/superadmin", req.url));
    }
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
  }

  // 3. Jika sudah login dan membuka /login atau /register
  if ((pathname === "/login" || pathname === "/register") && session && role) {
    if (role === "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard/superadmin", req.url));
    }
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
    return NextResponse.redirect(new URL("/attendance", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/attendance/:path*", "/login", "/register"],
};


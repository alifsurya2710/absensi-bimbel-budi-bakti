import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardRoot() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user?.role;

  // HANYA Superadmin dan Admin yang memiliki Dashboard
  if (role === "SUPERADMIN") {
    redirect("/dashboard/superadmin");
  }
  if (role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  // Role GURU dan MURID langsung diarahkan ke portal pengisian Presensi
  if (role === "GURU" || role === "MURID") {
    redirect("/attendance");
  }

  redirect("/login");
}


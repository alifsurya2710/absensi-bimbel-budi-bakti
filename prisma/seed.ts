import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  // Superadmin utama Bimbel BUDI BAKTI
  await prisma.user.upsert({
    where: { email: "superadmin@budibakti.sch.id" },
    update: {
      username: "superadmin",
      phone: "08111111111",
      password: hashedPassword,
    },
    create: {
      username: "superadmin",
      email: "superadmin@budibakti.sch.id",
      phone: "08111111111",
      name: "Superadmin Bimbel BUDI BAKTI",
      role: Role.SUPERADMIN,
      password: hashedPassword,
    },
  });

  console.log("✅ Seed selesai: akun Superadmin berhasil dibuat.");
  console.log("   Email   : superadmin@budibakti.sch.id");
  console.log("   Password: Admin@123");
  console.log("   ⚠️  Segera ganti password setelah login pertama!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

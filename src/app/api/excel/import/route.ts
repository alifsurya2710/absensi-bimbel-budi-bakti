import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// POST /api/excel/import - Import file Excel data murid / guru
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File Excel wajib diunggah." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: "File Excel tidak memiliki lembar kerja (sheet)." }, { status: 400 });
    }

    const worksheet = workbook.Sheets[sheetName];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Data di dalam file Excel kosong." }, { status: 400 });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const defaultHashedPassword = await bcrypt.hash("Bimbel@123", 10);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      // Mendukung nama kolom fleksibel (Nama/nama, Username/username, Role/role, Email/email, Phone/phone, Kelas/kelas)
      const name = row["Nama"] || row["nama"] || row["Name"] || row["name"];
      const usernameRaw = row["Username"] || row["username"];
      const roleRaw = (row["Peran"] || row["Role"] || row["role"] || "MURID").toString().toUpperCase().trim();
      const emailRaw = row["Email"] || row["email"];
      const phoneRaw = row["Telepon"] || row["No HP"] || row["Phone"] || row["phone"] || row["telepon"];
      const kelasRaw = row["Kelas"] || row["kelas"];

      if (!name || !usernameRaw) {
        results.skipped++;
        results.errors.push(`Baris ${rowNum}: Nama atau Username kosong.`);
        continue;
      }

      const username = String(usernameRaw).toLowerCase().trim();
      const role: Role = roleRaw === "GURU" ? "GURU" : "MURID";
      const email = emailRaw ? String(emailRaw).toLowerCase().trim() : null;
      const phone = phoneRaw ? String(phoneRaw).trim() : null;
      const kelas = role === "MURID" ? (kelasRaw ? String(kelasRaw).trim() : "XII RPL 1") : null;

      // Cek username duplikat
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        results.skipped++;
        results.errors.push(`Baris ${rowNum}: Username '@${username}' sudah ada.`);
        continue;
      }

      try {
        await prisma.user.create({
          data: {
            name: String(name).trim(),
            username,
            email,
            phone,
            role,
            kelas,
            password: defaultHashedPassword,
          },
        });
        results.imported++;
      } catch (err: unknown) {
        results.skipped++;
        const message = err instanceof Error ? err.message : "Kesalahan database";
        results.errors.push(`Baris ${rowNum}: Gagal menyimpan (@${username}) - ${message}`);
      }
    }

    return NextResponse.json({
      message: `Import selesai! Berhasil: ${results.imported}, Dilewati: ${results.skipped}`,
      results,
    });
  } catch (error) {
    console.error("POST /api/excel/import error:", error);
    return NextResponse.json({ error: "Gagal memproses file Excel." }, { status: 500 });
  }
}

// GET /api/excel/import - Download Template / Export Rekapitulasi Presensi Terbanyak dengan Style Biru Profesional
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    // 1. Template Contoh Import User
    if (mode === "template") {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Bimbel BUDI BAKTI";
      const worksheet = workbook.addWorksheet("Template_User");

      // Title Banner
      worksheet.mergeCells("A1:F1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "TEMPLATE IMPORT DATA PENGGUNA - BIMBEL BUDI BAKTI";
      titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } }; // Deep Navy Blue
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getRow(1).height = 34;

      // Header Row
      const headers = [
        { header: "Nama Lengkap", key: "name", width: 26 },
        { header: "Username", key: "username", width: 20 },
        { header: "Email", key: "email", width: 28 },
        { header: "No Telepon", key: "phone", width: 18 },
        { header: "Peran (GURU / MURID)", key: "role", width: 24 },
        { header: "Kelas (Khusus Murid)", key: "kelas", width: 22 },
      ];

      const headerRow = worksheet.getRow(2);
      headerRow.height = 26;
      headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h.header;
        cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } }; // Royal Blue
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFCBD5E1" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          bottom: { style: "medium", color: { argb: "FF1E40AF" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } },
        };
        worksheet.getColumn(idx + 1).width = h.width;
      });

      // Sample Data
      const sampleRows = [
        ["Ahmad Dahlan", "ahmad_dahlan", "ahmad@example.com", "081234567890", "GURU", ""],
        ["Siti Rahma", "siti_rahma", "siti@example.com", "089876543210", "MURID", "XII RPL 1"],
        ["Budi Pratama", "budi_pratama", "budi@example.com", "085678901234", "MURID", "XII RPL 2"],
      ];

      sampleRows.forEach((row, rowIdx) => {
        const addedRow = worksheet.addRow(row);
        addedRow.height = 22;
        const isEven = rowIdx % 2 === 1;
        addedRow.eachCell((cell, colNumber) => {
          cell.font = { name: "Arial", size: 10 };
          cell.alignment = {
            vertical: "middle",
            horizontal: colNumber === 5 || colNumber === 6 ? "center" : "left",
          };
          if (isEven) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7FF" } }; // Soft Ice Blue
          }
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="Template_Import_User.xlsx"',
        },
      });
    }

    // 2. Export Rekapitulasi Presensi Lengkap & Terurut (Professional Royal Blue)
    const [usersWithStats, allAttendances] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: { in: ["GURU", "MURID"] },
        },
        include: {
          attendances: {
            select: {
              status: true,
              approvalStatus: true,
            },
          },
        },
      }),
      prisma.attendance.findMany({
        include: {
          user: {
            select: {
              name: true,
              username: true,
              role: true,
              kelas: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const exportRows = usersWithStats.map((u) => {
      const totalMengisi = u.attendances.length;
      const totalHadir = u.attendances.filter((a) => a.status === "HADIR").length;
      const totalIzin = u.attendances.filter((a) => a.status === "IZIN").length;
      const totalSakit = u.attendances.filter((a) => a.status === "SAKIT").length;
      const totalDisetujui = u.attendances.filter((a) => a.approvalStatus === "APPROVED").length;
      const totalDitolak = u.attendances.filter((a) => a.approvalStatus === "REJECTED").length;
      const totalPending = u.attendances.filter((a) => a.approvalStatus === "PENDING").length;

      return {
        name: u.name || "-",
        username: u.username ? `@${u.username}` : "-",
        role: u.role,
        kelas: u.kelas || "-",
        phone: u.phone || "-",
        total: totalMengisi,
        hadir: totalHadir,
        izin: totalIzin,
        sakit: totalSakit,
        approved: totalDisetujui,
        rejected: totalDitolak,
        pending: totalPending,
      };
    });

    // Urutkan siapa yang paling aktif / paling banyak mengisi presensi
    exportRows.sort((a, b) => b.total - a.total);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Bimbel BUDI BAKTI";
    const worksheet = workbook.addWorksheet("Rekapitulasi Keaktifan");

    // Title Row 1: Banner Header Utama
    worksheet.mergeCells("A1:L1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "REKAPITULASI KEAKTIFAN PRESENSI - BIMBEL BUDI BAKTI";
    titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } }; // Deep Royal Navy Blue (#1e3a8a)
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(1).height = 36;

    // Subtitle Row 2: Waktu Export & Info
    worksheet.mergeCells("A2:L2");
    const subTitleCell = worksheet.getCell("A2");
    subTitleCell.value = `Dicetak otomatis pada: ${new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })} - Total Terdata: ${exportRows.length} Guru & Murid (Diurutkan dari Pengisian Terbanyak)`;
    subTitleCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FFFFFFFF" } };
    subTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } }; // Blue (#2563eb)
    subTitleCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(2).height = 24;

    // Empty row separator
    worksheet.addRow([]);
    worksheet.getRow(3).height = 10;

    // Columns Configuration
    const columnsConfig = [
      { header: "No", key: "no", width: 7 },
      { header: "Nama Lengkap", key: "name", width: 26 },
      { header: "Username", key: "username", width: 18 },
      { header: "Peran", key: "role", width: 14 },
      { header: "Kelas", key: "kelas", width: 16 },
      { header: "No Telepon", key: "phone", width: 18 },
      { header: "Total Pengisian", key: "total", width: 18 },
      { header: "Hadir", key: "hadir", width: 12 },
      { header: "Izin", key: "izin", width: 12 },
      { header: "Sakit", key: "sakit", width: 12 },
      { header: "Disetujui (Approved)", key: "approved", width: 22 },
      { header: "Ditolak (Rejected)", key: "rejected", width: 20 },
      { header: "Pending", key: "pending", width: 14 },
    ];

    // Table Header Row 4
    const headerRow = worksheet.getRow(4);
    headerRow.height = 28;
    columnsConfig.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } }; // Rich Blue (#1d4ed8)
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "medium", color: { argb: "FF1E3A8A" } },
        left: { style: "thin", color: { argb: "FF93C5FD" } },
        bottom: { style: "medium", color: { argb: "FF1E3A8A" } },
        right: { style: "thin", color: { argb: "FF93C5FD" } },
      };
      worksheet.getColumn(idx + 1).width = col.width;
    });

    // Populate Data Rows (Zebra Striping warna biru muda yang sejuk & rapi)
    exportRows.forEach((item, index) => {
      const row = worksheet.addRow([
        index + 1,
        item.name,
        item.username,
        item.role,
        item.kelas,
        item.phone,
        item.total,
        item.hadir,
        item.izin,
        item.sakit,
        item.approved,
        item.rejected,
        item.pending,
      ]);
      row.height = 22;

      const isEven = index % 2 === 1;
      const rowBgColor = isEven ? "FFF0F7FF" : "FFFFFFFF"; // Zebra Ice Blue (#f0f7ff) / White

      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Arial", size: 10, color: { argb: "FF1E293B" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };

        // Border lembut
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };

        // Alignment format
        if (colNumber === 1 || colNumber === 4 || colNumber === 5) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (colNumber >= 7) {
          // Kolom angka statistik di tengah & bold
          cell.alignment = { vertical: "middle", horizontal: "center" };
          if (colNumber === 7) {
            cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF1E40AF" } };
          }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        }
      });
    });

    // ============================================================
    // SHEET 2: DETAIL TRANSAKSI & APPROVAL PRESENSI
    // ============================================================
    const detailSheet = workbook.addWorksheet("Log Presensi & Approval");

    // Title Row 1 Sheet 2: Banner Header
    detailSheet.mergeCells("A1:K1");
    const detailTitleCell = detailSheet.getCell("A1");
    detailTitleCell.value = "LOG DETAIL PRESENSI & PERSETUJUAN (APPROVAL) - BIMBEL BUDI BAKTI";
    detailTitleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    detailTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }; // Deep Teal (#0f766e)
    detailTitleCell.alignment = { vertical: "middle", horizontal: "center" };
    detailSheet.getRow(1).height = 36;

    // Subtitle Row 2 Sheet 2
    detailSheet.mergeCells("A2:K2");
    const detailSubTitleCell = detailSheet.getCell("A2");
    detailSubTitleCell.value = `Total Catatan Log: ${allAttendances.length} Baris Presensi • Diurutkan dari yang Paling Terbaru`;
    detailSubTitleCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FFFFFFFF" } };
    detailSubTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D9488" } }; // Teal (#0d9488)
    detailSubTitleCell.alignment = { vertical: "middle", horizontal: "center" };
    detailSheet.getRow(2).height = 24;

    // Empty separator
    detailSheet.addRow([]);
    detailSheet.getRow(3).height = 10;

    // Columns Configuration Sheet 2
    const detailColumnsConfig = [
      { header: "No", key: "no", width: 7 },
      { header: "Tanggal", key: "date", width: 16 },
      { header: "Waktu", key: "time", width: 12 },
      { header: "Nama Lengkap", key: "name", width: 26 },
      { header: "Username", key: "username", width: 18 },
      { header: "Peran", key: "role", width: 14 },
      { header: "Kelas", key: "kelas", width: 16 },
      { header: "Status Presensi", key: "status", width: 16 },
      { header: "Status Approval", key: "approvalStatus", width: 20 },
      { header: "Alasan Penolakan", key: "rejectionReason", width: 30 },
      { header: "Catatan / Keterangan", key: "notes", width: 32 },
    ];

    // Table Header Row 4 Sheet 2
    const detailHeaderRow = detailSheet.getRow(4);
    detailHeaderRow.height = 28;
    detailColumnsConfig.forEach((col, idx) => {
      const cell = detailHeaderRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "medium", color: { argb: "FF115E59" } },
        left: { style: "thin", color: { argb: "FF99F6E4" } },
        bottom: { style: "medium", color: { argb: "FF115E59" } },
        right: { style: "thin", color: { argb: "FF99F6E4" } },
      };
      detailSheet.getColumn(idx + 1).width = col.width;
    });

    // Populate Data Rows Sheet 2
    allAttendances.forEach((att, index) => {
      const createdDate = new Date(att.createdAt);
      const dateStr = createdDate.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const timeStr = createdDate.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const approvalLabel =
        att.approvalStatus === "APPROVED"
          ? "Disetujui (Approved)"
          : att.approvalStatus === "REJECTED"
          ? "Ditolak (Rejected)"
          : "Menunggu Review";

      const row = detailSheet.addRow([
        index + 1,
        dateStr,
        timeStr,
        att.user?.name || "-",
        att.user?.username ? `@${att.user.username}` : "-",
        att.user?.role || "-",
        att.user?.kelas || "-",
        att.status.replace("_", " "),
        approvalLabel,
        att.rejectionReason || "-",
        att.notes || "-",
      ]);
      row.height = 22;

      const isEven = index % 2 === 1;
      const rowBgColor = isEven ? "FFF0FDFA" : "FFFFFFFF"; // Mint tint (#f0fdfa) / White

      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Arial", size: 10, color: { argb: "FF1E293B" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };

        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };

        // Alignment format
        if (colNumber === 1 || colNumber === 2 || colNumber === 3 || colNumber === 6 || colNumber === 7) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (colNumber === 8 || colNumber === 9) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          // Beri warna khusus pada status approval
          if (att.approvalStatus === "APPROVED") {
            cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF047857" } };
          } else if (att.approvalStatus === "REJECTED") {
            cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFB91C1C" } };
          } else {
            cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFB45309" } };
          }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Rekap_Keaktifan_Presensi.xlsx"',
      },
    });
  } catch (error) {
    console.error("GET /api/excel/import error:", error);
    return NextResponse.json({ error: "Gagal mengunduh data Excel" }, { status: 500 });
  }
}

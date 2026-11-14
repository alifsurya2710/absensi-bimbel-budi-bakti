import nodemailer from "nodemailer";

/**
 * Transporter Nodemailer:
 * Jika SMTP credentials diatur di .env (GMAIL_USER & GMAIL_PASS), gunakan Gmail.
 * Jika belum diatur, gunakan Ethereal Test Account agar fitur tetap bisa dites dan menghasilkan URL preview email secara otomatis.
 */
export async function sendOtpPasswordEmail(to: string, otpCode: string, userName: string) {
  let transporter: nodemailer.Transporter;

  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
  } else {
    // Mode simulasi/pengembangan jika Gmail App Password belum diisi di .env
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const mailOptions = {
    from: `"Absensi Bimbel BUDI BAKTI" <${process.env.GMAIL_USER || "no-reply@budibakti.sch.id"}>`,
    to,
    subject: `${otpCode} adalah Kode Verifikasi OTP Reset Kata Sandi Anda`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #4338ca; margin: 0;">Absensi Bimbel BUDI BAKTI</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Verifikasi Reset Kata Sandi Akun</p>
        </div>

        <p style="color: #1e293b; font-size: 15px;">Halo <strong>${userName}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Berikut adalah <strong>Kode OTP Verifikasi</strong> 6 digit Anda untuk mengatur ulang kata sandi:
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #4f46e5; background: #eef2ff; padding: 14px 28px; border-radius: 12px; border: 2px dashed #6366f1;">
            ${otpCode}
          </span>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center;">
          Kode ini bersifat rahasia dan hanya berlaku selama <strong>15 menit</strong>.<br/>
          Jangan berikan kode ini kepada siapapun termasuk pihak bimbel.
        </p>

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">
          © ${new Date().getFullYear()} Bimbel BUDI BAKTI. Seluruh hak cipta dilindungi.
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("-----------------------------------------");
    console.log(`📧 KODE OTP UNTUK ${to}: [ ${otpCode} ]`);
    console.log("PREVIEW EMAIL (ETHEREAL):", previewUrl);
    console.log("-----------------------------------------");
  }

  return { messageId: info.messageId, previewUrl };
}


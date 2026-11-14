/**
 * Validasi Password:
 * - Minimal 8 karakter
 * - Minimal 1 huruf besar (A-Z)
 * - Minimal 1 huruf kecil (a-z)
 * - Minimal 1 angka (0-9)
 * - Minimal 1 simbol (@$!%*?&)
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, message: "Kata sandi minimal 8 karakter." };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Kata sandi harus mengandung minimal 1 huruf besar (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Kata sandi harus mengandung minimal 1 huruf kecil (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Kata sandi harus mengandung minimal 1 angka (0-9)." };
  }
  if (!/[@$!%*?&]/.test(password)) {
    return { isValid: false, message: "Kata sandi harus mengandung minimal 1 simbol (@$!%*?&)." };
  }

  return { isValid: true };
}


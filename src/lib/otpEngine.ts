// OTP Engine — issue, verify, consume.
// Persisted in localStorage so it works whether you're running the Brevo
// mock relay (local) or real Brevo SMTP (production).

const OTP_STORAGE_KEY = 'kaalvastr_pending_otp_v1';

export interface PendingOtp {
  email: string;
  code: string;          // 6-digit, stored hashed-agnostic (demo app)
  expiresAt: number;     // epoch ms
  attemptsLeft: number;  // max 5
  resendAt: number;      // epoch ms when resend is next allowed (60s throttle)
}

function readAll(): PendingOtp[] {
  try {
    const raw = localStorage.getItem(OTP_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingOtp[]) : [];
  } catch {
    return [];
  }
}

function writeAll(all: PendingOtp[]) {
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(all));
}

function freshCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Issue a 6-digit OTP for an email (overwrites any prior pending one). */
export function issueOtp(email: string): { code: string; expiresAt: number; resendAt: number } {
  const code = freshCode();
  const now = Date.now();
  const entry: PendingOtp = {
    email: email.toLowerCase().trim(),
    code,
    expiresAt: now + 10 * 60 * 1000,
    attemptsLeft: 5,
    resendAt: now + 60 * 1000,
  };
  const filtered = readAll().filter((e) => e.email !== entry.email);
  filtered.push(entry);
  writeAll(filtered);
  return { code, expiresAt: entry.expiresAt, resendAt: entry.resendAt };
}

/** True when a 60s resend cooldown is still active for this email. */
export function isResendLocked(email: string): { locked: boolean; retryAfterMs: number } {
  const entry = readAll().find((e) => e.email === email.toLowerCase().trim());
  if (!entry) return { locked: false, retryAfterMs: 0 };
  const remaining = entry.resendAt - Date.now();
  return { locked: remaining > 0, retryAfterMs: Math.max(0, remaining) };
}

/** Extend the resend throttle for an email (call after each resend). */
export function markResent(email: string) {
  const entry = readAll().find((e) => e.email === email.toLowerCase().trim());
  if (entry) {
    entry.resendAt = Date.now() + 60 * 1000;
    writeAll(readAll().map((e) => (e.email === entry.email ? entry : e)));
  }
}

/**
 * Verify a submitted code. Consumes on success (cannot be reused) and on
 * running out of attempts (user must request a fresh OTP).
 */
export function verifyOtp(email: string, submitted: string): { success: boolean; reason?: 'expired' | 'locked' | 'attempts-exhausted' | 'mismatch' } {
  const key = email.toLowerCase().trim();
  const all = readAll();
  const entry = all.find((e) => e.email === key);
  if (!entry) return { success: false, reason: 'expired' };

  if (Date.now() > entry.expiresAt) {
    writeAll(all.filter((e) => e.email !== key));
    return { success: false, reason: 'expired' };
  }

  if (submitted.trim() === entry.code) {
    writeAll(all.filter((e) => e.email !== key));
    return { success: true };
  }

  entry.attemptsLeft -= 1;
  if (entry.attemptsLeft <= 0) {
    writeAll(all.filter((e) => e.email !== key));
    return { success: false, reason: 'attempts-exhausted' };
  }
  writeAll(all);
  return { success: false, reason: 'mismatch' };
}

/** Demo helper: in mock/local mode the code is also written to the console. */
export function logOtpForDev(email: string, code: string) {
  console.log(`[Kaal Vastr OTP Relay] Verification code for ${email}: ${code} (expires in 10 min)`);
}

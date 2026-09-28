import crypto from "crypto";

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

// Global in-memory cache preserved across HMR in development
const globalForOtp = globalThis as unknown as {
  valenceOtpStore: Map<string, OtpRecord> | undefined;
};

const otpStore: Map<string, OtpRecord> =
  globalForOtp.valenceOtpStore ?? new Map<string, OtpRecord>();

if (process.env.NODE_ENV !== "production") {
  globalForOtp.valenceOtpStore = otpStore;
}

/**
 * Generate a 6-digit cryptographic OTP code
 */
export function generateOtpCode(): string {
  // Generate random 6-digit number between 100000 and 999999
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Store OTP for an email with 10-minute expiry and 60-second cooldown
 */
export function setOtpForEmail(email: string, code: string): { allowed: boolean; waitSeconds?: number } {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = otpStore.get(normalizedEmail);
  const now = Date.now();

  // Enforce 60-second cooldown between requests
  if (existing && now - existing.lastSentAt < 60000) {
    const waitSeconds = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
    return { allowed: false, waitSeconds };
  }

  otpStore.set(normalizedEmail, {
    code,
    expiresAt: now + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
    lastSentAt: now,
  });

  return { allowed: true };
}

/**
 * Verify an OTP code for an email
 */
export function verifyOtpForEmail(
  email: string,
  inputCode: string
): { valid: boolean; reason?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);
  const now = Date.now();

  if (!record) {
    return { valid: false, reason: "No verification code was requested for this email." };
  }

  if (now > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return { valid: false, reason: "Verification code has expired. Please request a new one." };
  }

  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    return { valid: false, reason: "Too many failed attempts. Please request a new code." };
  }

  record.attempts += 1;

  if (record.code !== inputCode.trim()) {
    return { valid: false, reason: "Incorrect verification code. Please check your Gmail." };
  }

  // Code verified! Delete record to prevent replay attacks
  otpStore.delete(normalizedEmail);
  return { valid: true };
}

/**
 * Derive a deterministic Robinhood Chain Mainnet wallet address from an email or user identifier
 */
export function deriveMainnetWalletForUser(email: string): string {
  const hash = crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  // Take last 40 hex characters for EVM address standard
  const address = `0x${hash.slice(-40)}`;
  return address;
}

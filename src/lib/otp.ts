import { createHmac, randomInt } from "crypto";

export function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

export function hashOtp(otp: string, email: string): string {
  const secret = process.env.AUTH_SECRET ?? "dev-secret";
  return createHmac("sha256", secret)
    .update(`${otp}:${email.toLowerCase()}`)
    .digest("hex");
}

export function verifyOtp(
  input: string,
  email: string,
  storedHash: string,
): boolean {
  return hashOtp(input.trim(), email) === storedHash;
}

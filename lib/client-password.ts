import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { requiredEnv } from "@/lib/env";
import { hashSecret, isModernPasswordHash, verifySecret } from "@/lib/password";

export const hashClientPassword = hashSecret;

export async function verifyClientPassword(password: string, storedHash: string) {
  if (isModernPasswordHash(storedHash)) return verifySecret(password, storedHash);
  // Read legacy hashes only to migrate existing users after a successful login.
  if (!/^[a-f0-9]{64}$/.test(storedHash)) return false;
  const hash = createHmac("sha256", requiredEnv("ADMIN_SESSION_SECRET")).update(password).digest("hex");
  return timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

function secureCompare(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export function hashClientPassword(password: string): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "luna-secret")
    .update(password)
    .digest("hex");
}

export function verifyClientPassword(password: string, storedHash: string): boolean {
  return secureCompare(hashClientPassword(password), storedHash);
}

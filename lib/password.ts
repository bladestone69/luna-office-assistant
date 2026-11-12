import { randomBytes, scrypt, timingSafeEqual } from "crypto";

const PREFIX = "scrypt-v1";
const OPTIONS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, OPTIONS, (error, key) => error ? reject(error) : resolve(key));
  });
}

export function isModernPasswordHash(hash: string) {
  return hash.startsWith(`${PREFIX}:`);
}

export async function hashSecret(password: string) {
  if (!password || password.length > 1024) throw new Error("Password must contain between 1 and 1024 characters");
  const salt = randomBytes(32);
  const key = await derive(password, salt);
  return `${PREFIX}:${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifySecret(password: string, stored: string) {
  if (!password || password.length > 1024) return false;
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== PREFIX || !/^[a-f0-9]{64}$/.test(parts[1]) || !/^[a-f0-9]{128}$/.test(parts[2])) return false;
  const key = await derive(password, Buffer.from(parts[1], "hex"));
  return timingSafeEqual(key, Buffer.from(parts[2], "hex"));
}

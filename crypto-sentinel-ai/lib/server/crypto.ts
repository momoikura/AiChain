import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * AES-256-GCM encryption for secrets at rest (exchange API keys).
 *
 * The key is derived from APIKEY_ENC_SECRET. Ciphertext is stored in Supabase;
 * the plaintext key/secret never touches the database. Set a strong, stable
 * APIKEY_ENC_SECRET in the environment — changing it invalidates stored keys.
 */

function key(): Buffer {
  const secret = process.env.APIKEY_ENC_SECRET;
  // Fail closed in production: never encrypt real keys under a known dev secret.
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("APIKEY_ENC_SECRET is not configured (min 16 chars)");
    }
    return scryptSync("dev-only-insecure-local", "sentinel-apikey-salt", 32);
  }
  return scryptSync(secret, "sentinel-apikey-salt", 32);
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) throw new Error("Malformed ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

/** Mask a secret for display, e.g. "abcd…wxyz". */
export function maskSecret(plaintext: string): string {
  if (plaintext.length <= 8) return "••••";
  return `${plaintext.slice(0, 4)}…${plaintext.slice(-4)}`;
}

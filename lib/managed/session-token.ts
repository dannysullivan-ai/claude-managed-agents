import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import type { City } from "../types";

export const SESSION_COOKIE = "offsite_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export type SessionToken = {
  version: 1;
  sessionId: string;
  owner: string;
  city: City;
  expiresAt: number;
};

function key(secret: string): Buffer {
  if (secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return createHash("sha256").update(secret).digest();
}

export function newSessionToken(sessionId: string, now = Date.now(), city: City = "Chicago"): SessionToken {
  return { version: 1, sessionId, owner: randomUUID(), city, expiresAt: now + SESSION_TTL_SECONDS * 1000 };
}

/** Authenticated encryption keeps the hosted session capability in an HttpOnly cookie. */
export function sealSession(token: SessionToken, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(token), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function openSession(value: string, secret: string, now = Date.now()): SessionToken | null {
  try {
    if (value.length > 2048) return null;
    const parts = value.split(".");
    if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return null;
    const [iv, tag, ciphertext] = parts.map((part) => Buffer.from(part, "base64url"));
    if (iv.length !== 12 || tag.length !== 16) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(secret), iv);
    decipher.setAuthTag(tag);
    const token: unknown = JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8"));
    if (!token || typeof token !== "object") return null;
    const candidate = token as Partial<SessionToken>;
    if (candidate.version !== 1 || typeof candidate.sessionId !== "string"
      || !/^sesn_[A-Za-z0-9]+$/.test(candidate.sessionId)
      || typeof candidate.owner !== "string" || !/^[a-f0-9-]{36}$/.test(candidate.owner)
      || typeof candidate.expiresAt !== "number" || candidate.expiresAt <= now
      || (candidate.city !== undefined && !["Chicago", "New York", "San Francisco"].includes(candidate.city))) return null;
    return { ...candidate, city: candidate.city ?? "Chicago" } as SessionToken;
  } catch {
    return null;
  }
}

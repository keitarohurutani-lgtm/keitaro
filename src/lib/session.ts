// 署名付きCookieによるセッション。DBにセッションテーブルは持たず、
// `userId.expiresAt.HMAC署名` の形でCookie自体に有効性を持たせる。
// Web Crypto（crypto.subtle）を使うため、Node runtime（API Routes）・
// Edge runtime（middleware）のどちらでも同じロジックが動く。

export const SESSION_COOKIE = "asobi_session";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30日

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // 開発用フォールバック。本番では必ずSESSION_SECRETを設定すること。
    return "dev-insecure-secret-change-me-in-production";
  }
  return secret;
}

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionCookieValue(userId: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  const signature = await hmacHex(payload);
  return `${payload}.${signature}`;
}

export async function verifySessionCookieValue(
  value: string | undefined | null
): Promise<string | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!userId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  const expectedSignature = await hmacHex(`${userId}.${expiresAtRaw}`);
  if (expectedSignature !== signature) return null;

  return userId;
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

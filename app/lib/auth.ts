import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE = "mcins_session";

function parseExpiresIn(value: string | undefined): number {
  if (!value) return 86400;
  const m = /^(\d+)([smhd]?)$/.exec(value.trim());
  if (!m) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : 86400;
  }
  const n = parseInt(m[1], 10);
  switch (m[2]) {
    case "s": return n;
    case "m": return n * 60;
    case "h": return n * 3600;
    case "d": return n * 86400;
    default: return n;
  }
}

export const SESSION_MAX_AGE = parseExpiresIn(process.env.JWT_EXPIRES_IN);

export type SessionPayload = { sub: string; email: string };
export type DecodedSession = SessionPayload & { iat: number; exp: number };

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<DecodedSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    if (typeof payload.iat !== "number" || typeof payload.exp !== "number") return null;
    return { sub: payload.sub, email: payload.email, iat: payload.iat, exp: payload.exp };
  } catch {
    return null;
  }
}

export function shouldSlide(decoded: DecodedSession): boolean {
  const now = Math.floor(Date.now() / 1000);
  const total = decoded.exp - decoded.iat;
  const remaining = decoded.exp - now;
  return total > 0 && remaining * 2 < total;
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function clearCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type DecodedSession } from "./auth";

export type SessionAdmin = { id: string; email: string };

export async function getSessionAdmin(): Promise<SessionAdmin | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const decoded = await verifySession(token);
  if (!decoded) return null;
  return toAdmin(decoded);
}

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function requireSessionAdmin(): Promise<SessionAdmin> {
  const admin = await getSessionAdmin();
  if (!admin) throw new UnauthorizedError();
  return admin;
}

function toAdmin(decoded: DecodedSession): SessionAdmin {
  return { id: decoded.sub, email: decoded.email };
}

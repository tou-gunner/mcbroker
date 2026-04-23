import bcrypt from "bcryptjs";

const MIN_LENGTH = 8;
const BCRYPT_COST = 10;

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < MIN_LENGTH) {
    throw new Error(`password must be at least ${MIN_LENGTH} characters`);
  }
  return await bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  return await bcrypt.compare(plain, hash);
}

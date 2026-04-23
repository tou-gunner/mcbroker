import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/app/lib/session";

export async function GET() {
  const admin = await getSessionAdmin();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ id: admin.id, email: admin.email });
}

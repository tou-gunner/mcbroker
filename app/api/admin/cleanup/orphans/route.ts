import { NextRequest, NextResponse } from "next/server";
import { listObjects, deleteObjects, publicUrl } from "@/app/lib/s3";
import { collectReferencedKeys } from "@/app/lib/orphans";

const SCAN_PREFIXES = ["insurances/"];

type OrphanItem = {
  key: string;
  url: string;
  size: number;
  lastModified: string;
};

async function findOrphans(minAgeHours: number): Promise<OrphanItem[]> {
  const cutoff = new Date(Date.now() - minAgeHours * 3_600_000);

  const [buckets, referenced] = await Promise.all([
    Promise.all(SCAN_PREFIXES.map((p) => listObjects(p))),
    collectReferencedKeys(),
  ]);
  const objects = buckets.flat();

  return objects
    .filter((o) => !referenced.has(o.key))
    .filter((o) => o.lastModified <= cutoff)
    .sort((a, b) => a.lastModified.getTime() - b.lastModified.getTime())
    .map((o) => ({
      key: o.key,
      url: publicUrl(o.key),
      size: o.size,
      lastModified: o.lastModified.toISOString(),
    }));
}

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get("minAgeHours") ?? "24";
    const minAgeHours = Math.max(0, Number.isFinite(parseFloat(raw)) ? parseFloat(raw) : 24);

    const orphans = await findOrphans(minAgeHours);
    const totalBytes = orphans.reduce((s, o) => s + o.size, 0);

    return NextResponse.json({
      success: true,
      minAgeHours,
      scannedPrefixes: SCAN_PREFIXES,
      count: orphans.length,
      totalBytes,
      orphans,
    });
  } catch (error) {
    console.error("orphan scan failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = Array.isArray(body?.keys) ? body.keys : [];
    const keys: string[] = input.filter((k: unknown): k is string => typeof k === "string");

    if (keys.length === 0) {
      return NextResponse.json(
        { success: false, error: "keys (string[]) is required" },
        { status: 400 },
      );
    }

    // Guardrail 1: only delete under allowed prefixes.
    const outOfScope = keys.filter((k) => !SCAN_PREFIXES.some((p) => k.startsWith(p)));
    if (outOfScope.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "some keys are outside allowed prefixes",
          outOfScope,
          allowedPrefixes: SCAN_PREFIXES,
        },
        { status: 400 },
      );
    }

    // Guardrail 2: re-check references right before delete to avoid racing an upload.
    const referenced = await collectReferencedKeys();
    const toDelete = keys.filter((k) => !referenced.has(k));
    const skippedNowReferenced = keys.filter((k) => referenced.has(k));

    const deleted = await deleteObjects(toDelete);

    return NextResponse.json({
      success: true,
      requested: keys.length,
      deleted,
      skippedNowReferenced,
    });
  } catch (error) {
    console.error("orphan delete failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import {
  s3,
  S3_BUCKET,
  publicUrl,
  ALLOWED_IMAGE_TYPES,
  extForMime,
} from "@/app/lib/s3";
import { prisma } from "@/app/lib/prisma";

const MAX_SIZE = 10 * 1024 * 1024;

const SCOPES = [
  "insurance-content",
  "insurance-image",
  "insurance-thumbnail",
  "company-logo",
  "banner",
  "setting",
] as const;
type Scope = (typeof SCOPES)[number];

async function buildKey(
  scope: Scope,
  ext: string,
  entityId?: string,
  entityKey?: string,
): Promise<{ ok: true; key: string } | { ok: false; error: string; status?: number }> {
  switch (scope) {
    case "insurance-content":
      return { ok: true, key: `insurances/content/${randomUUID()}.${ext}` };
    case "insurance-image":
      if (!entityId) return { ok: false, error: "entityId required for insurance-image" };
      return { ok: true, key: `insurances/${entityId}/${randomUUID()}.${ext}` };
    case "insurance-thumbnail":
      if (!entityId) return { ok: false, error: "entityId required for insurance-thumbnail" };
      return { ok: true, key: `insurances/${entityId}/thumbnail.${ext}` };
    case "company-logo": {
      if (!entityId) return { ok: false, error: "entityId required for company-logo" };
      const company = await prisma.company.findUnique({
        where: { id: entityId },
        select: { slug: true },
      });
      if (!company) return { ok: false, error: "company not found", status: 404 };
      return { ok: true, key: `companies/${company.slug}/logo.${ext}` };
    }
    case "banner":
      return { ok: true, key: `banners/${randomUUID()}.${ext}` };
    case "setting":
      if (!entityKey) return { ok: false, error: "entityKey required for setting" };
      return { ok: true, key: `settings/${entityKey}.${ext}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const scope = form.get("scope");
    const entityId = form.get("entityId");
    const entityKey = form.get("entityKey");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (typeof scope !== "string" || !SCOPES.includes(scope as Scope)) {
      return NextResponse.json(
        { error: `scope must be one of ${SCOPES.join(", ")}` },
        { status: 400 },
      );
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "file is empty" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `file exceeds ${MAX_SIZE} bytes (10MB)` },
        { status: 400 },
      );
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `unsupported content type: ${file.type}` },
        { status: 400 },
      );
    }

    const ext = extForMime(file.type);
    if (!ext) {
      return NextResponse.json({ error: "unsupported content type" }, { status: 400 });
    }

    const built = await buildKey(
      scope as Scope,
      ext,
      typeof entityId === "string" ? entityId : undefined,
      typeof entityKey === "string" ? entityKey : undefined,
    );
    if (!built.ok) {
      return NextResponse.json({ error: built.error }, { status: built.status ?? 400 });
    }

    const body = Buffer.from(await file.arrayBuffer());
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: built.key,
        Body: body,
        ContentType: file.type,
      }),
    );

    return NextResponse.json({ url: publicUrl(built.key), key: built.key });
  } catch (error) {
    console.error("upload failed:", error);
    return NextResponse.json(
      {
        error: "upload failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

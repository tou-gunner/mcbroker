import { prisma } from "./prisma";
import { keyFromPublicUrl } from "./s3";

export function extractTipTapImages(node: unknown): string[] {
  const urls: string[] = [];
  const walk = (n: any) => {
    if (!n || typeof n !== "object") return;
    if (n.type === "image" && typeof n.attrs?.src === "string") {
      urls.push(n.attrs.src);
    }
    if (Array.isArray(n.content)) n.content.forEach(walk);
    if (Array.isArray(n.marks)) n.marks.forEach(walk);
  };
  walk(node);
  return urls;
}

export function extractHtmlImages(html: string | null | undefined): string[] {
  if (!html) return [];
  const urls: string[] = [];
  const re = /<img\b[^>]*\ssrc=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) urls.push(m[1]);
  return urls;
}

export async function collectReferencedKeys(): Promise<Set<string>> {
  const referenced = new Set<string>();
  const record = (url: string | null | undefined) => {
    if (!url) return;
    const key = keyFromPublicUrl(url);
    if (key) referenced.add(key);
  };

  const [contents, companies, settings] = await Promise.all([
    prisma.insuranceContent.findMany({
      select: { contentJson: true, contentHtml: true, images: true },
    }),
    prisma.company.findMany({ select: { logo: true } }),
    prisma.setting.findMany({ select: { value: true } }),
  ]);

  for (const c of contents) {
    extractTipTapImages(c.contentJson).forEach(record);
    extractHtmlImages(c.contentHtml).forEach(record);
    for (const img of c.images ?? []) record(img);
  }
  for (const co of companies) record(co.logo);
  for (const s of settings) record(s.value);

  return referenced;
}

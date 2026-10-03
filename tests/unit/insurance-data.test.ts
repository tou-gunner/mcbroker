import { test } from 'node:test';
import { expect } from '@playwright/test';
import { NextRequest } from 'next/server';
import { formatInsuranceDetail, insuranceApiResponse } from '@/app/services/insurance-detail';
import { cleanArticleHtml, hasArticleHtml } from '@/app/lib/article-html';
import { prisma } from '@/app/lib/prisma';
import { GET } from '@/app/api/insurances/[id]/route';
import { insuranceRecord } from '../fixtures/insurance-data';

test('missing, draft, archived and inactive products are not public', () => {
  expect(formatInsuranceDetail(null, 'en')).toBeUndefined();
  for (const status of ['DRAFT', 'ARCHIVED']) expect(formatInsuranceDetail({ ...insuranceRecord(), status }, 'en')).toBeUndefined();
  const record = insuranceRecord(); record.company.isActive = false;
  expect(formatInsuranceDetail(record, 'en')).toBeUndefined();
});

test('unpublished article fields never enter the public response', () => {
  const record = insuranceRecord(); record.content[0].isPublished = false;
  const data = insuranceApiResponse(formatInsuranceDetail(record, 'en')!);
  expect(data.contentHtml).toBeNull(); expect(data.contentJson).toBeNull(); expect(data.contentText).toBeNull(); expect(data.images).toEqual([]);
  expect(data.name).toBe('Family Health Plan');
  expect(Object.keys(data).sort()).toEqual(['id', 'name', 'description', 'category', 'categoryId', 'company', 'companyId', 'slug', 'featured', 'priority', 'contentHtml', 'contentJson', 'contentText', 'images', 'createdAt', 'updatedAt'].sort());
});

test('requested published content wins; unavailable or empty translations fall back only to English', () => {
  const record = insuranceRecord();
  const english = record.content[0];
  record.content.push({ ...english, locale: 'lo', contentHtml: '<p>ການຄຸ້ມຄອງ</p>', contentText: null });
  expect(formatInsuranceDetail(record, 'lo')?.contentLocale).toBe('lo');
  record.content[1].isPublished = false;
  expect(formatInsuranceDetail(record, 'lo')?.contentLocale).toBe('en');
  record.content[1].isPublished = true;
  record.content[1].contentHtml = '<p> &nbsp;\u200b </p><script>hidden</script>';
  expect(formatInsuranceDetail(record, 'lo')?.contentLocale).toBe('en');
  record.content[1].contentText = 'ລາຍລະອຽດ';
  expect(formatInsuranceDetail(record, 'lo')?.contentLocale).toBe('lo');
  record.content = [{ ...english, locale: 'fr' }];
  expect(formatInsuranceDetail(record, 'lo')?.contentLocale).toBeNull();
  record.content = [{ ...english, locale: 'lo' }];
  expect(formatInsuranceDetail(record, 'lo')?.contentLocale).toBe('lo'); // Do not guess language from the text.
});

test('display sanitization removes executable markup and styling while retaining article structure', () => {
  const source = '<h1 id="cover">Cover</h1><p style="color:white;font-size:1px;text-align:center" onclick="alert(1)">Text <strong>bold</strong></p><script>alert(1)</script><iframe src="https://example.test">hidden</iframe><svg onload="alert(1)"></svg><a href="javascript:alert(1)">Bad</a><a href="https://example.test/terms.pdf" target="_blank">Terms</a><img src="data:image/svg+xml,bad" onerror="alert(1)"><table><tr><th scope="col" colspan="2">Cover</th></tr><tr><td rowspan="2">Value</td></tr></table>';
  const clean = cleanArticleHtml(source);
  expect(clean).not.toMatch(/script|iframe|svg|onclick|onerror|javascript:|data:|color:|font-size/);
  expect(clean).toContain('<h2 id="cover">Cover</h2>');
  expect(clean).toContain('text-align:center'); expect(clean).toContain('<strong>bold</strong>');
  expect(clean).toContain('https://example.test/terms.pdf'); expect(clean).toContain('colspan="2"'); expect(clean).toContain('rowspan="2"');
  expect(hasArticleHtml('<p><br></p>')).toBe(false);
  expect(hasArticleHtml('<img src="https://example.test/cover.png" alt="Cover">')).toBe(true);
  expect(source).toContain('onclick'); // The stored source is not rewritten.
});

test('API distinguishes a temporary read failure from a missing product', async () => {
  const original = prisma.insurance.findFirst;
  try {
    prisma.insurance.findFirst = (() => Promise.reject(new Error('Intentional service failure'))) as typeof original;
    const failed = await GET(new NextRequest('http://localhost/api/insurances/fixture'), { params: Promise.resolve({ id: 'fixture' }) });
    expect(failed.status).toBe(500);
    expect(await failed.json()).toEqual({ success: false, error: 'Failed to fetch insurance' });
    prisma.insurance.findFirst = (() => Promise.resolve(null)) as typeof original;
    const missing = await GET(new NextRequest('http://localhost/api/insurances/fixture'), { params: Promise.resolve({ id: 'fixture' }) });
    expect(missing.status).toBe(404);
  } finally { prisma.insurance.findFirst = original; }
});

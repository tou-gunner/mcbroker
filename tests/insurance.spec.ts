import { test, expect, type Page } from '@playwright/test';

const companyId = '193e673e-2659-43d5-8e7c-5300199c3ab5';
const productId = '33a99022-10d4-4cf1-93fc-ac7acfc7077f';
async function contactSettings(page: Page, available = false) {
  await page.route('**/api/settings?prefix=contact_*', route => route.fulfill({ json: { success: true, data: available ? { contact_phone: '+856 20 5555 0101', contact_whatsapp: '+856 20 5555 0102' } : {} } }));
}

test('all seeded product articles are available in both locales during concurrent API reads', async ({ request }) => {
  const catalog = await (await request.get(`/api/insurances?companyId=${companyId}&locale=en`)).json();
  expect(catalog.data).toHaveLength(16);
  const responses = await Promise.all(catalog.data.flatMap((product: { id: string }) => ['en', 'lo'].map(async locale => {
    const response = await request.get(`/api/insurances/${product.id}?locale=${locale}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true); expect(body.data.contentHtml).toBeTruthy();
    expect(Object.keys(body.data)).toHaveLength(16);
    return body.data.id;
  })));
  expect(responses).toHaveLength(32);
});

test('product identity, metadata, breadcrumbs and localized advisor messages work across navigation', async ({ page, baseURL }) => {
  await contactSettings(page, true);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const locale of ['en', 'lo']) {
    await page.goto(`/${locale}/insurance/${productId}`);
    const name = await page.locator('h1').innerText();
    expect(name).toBeTruthy(); await expect(page).toHaveTitle(`${name} | MC Broker`);
    await expect(page.locator('h1')).toHaveCount(1); await expect(page.locator('#contact')).toHaveCount(1);
    await expect(page.locator('.insurance-article')).toHaveAttribute('lang', locale);
    await expect(page.locator('.article-language-notice')).toHaveCount(0);
    await expect(page.locator('.company-breadcrumbs a').nth(1)).toHaveAttribute('href', `/${locale}/company/${companyId}`);
    await expect(page.locator('.header-advisor')).toHaveAttribute('href', '#contact');
    const whatsapp = page.locator('#contact a[href^="https://wa.me/"]');
    await expect(whatsapp).toHaveCount(1);
    const url = new URL((await whatsapp.getAttribute('href'))!);
    expect(url.pathname).toBe('/8562055550102');
    expect(url.searchParams.get('text')).toContain(name); expect(url.searchParams.get('text')).toContain('Allianz Insurance Laos (AGL)');
    expect(url.searchParams.get('text')).toContain(`${baseURL}/${locale}/insurance/${productId}`);
    await expect(page.locator('footer a[href^="https://wa.me/"]')).toHaveAttribute('href', url.href);
    await expect(page.locator('#contact a[href^="tel:"]')).toHaveAttribute('href', 'tel:+8562055550101');
  }
  await page.locator('.insurance-insurer').click();
  await expect(page.locator('.company-intro')).toBeVisible();
  await expect(page.locator('#contact a[href^="https://wa.me/"]')).not.toHaveAttribute('href', /Health%20Insurance/);
  await page.locator('header.site-header .brand').click();
  await expect(page.locator('.hero-section')).toBeVisible();
  await expect(page.locator('#contact a[href^="https://wa.me/"]')).not.toHaveAttribute('href', /Allianz/);
  expect(errors).toEqual([]);
});

test('unavailable products have localized recovery and a 404 API response', async ({ page, request }) => {
  const id = '00000000-0000-0000-0000-000000000000';
  const response = await request.get(`/api/insurances/${id}`); expect(response.status()).toBe(404);
  await page.goto(`/lo/insurance/${id}`);
  await expect(page.locator('h1')).toHaveText('ແຜນປະກັນນີ້ບໍ່ພ້ອມໃຫ້ເບິ່ງ');
  await expect(page.locator('main a[href="/lo#company-list"]')).toBeVisible();
  await expect(page.locator('.mobile-advisor')).toHaveCount(0);
});

test.describe('isolated insurance fixtures', () => {
  test.skip(!process.env.INSURANCE_FIXTURE_TESTS, 'Requires preview-only insurance fixture route');
  test.beforeEach(async ({ page }) => {
    await contactSettings(page);
    await page.route('https://example.test/**', route => route.request().url().endsWith('good-article.png')
      ? route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="#dcefe4"/></svg>' })
      : route.abort());
  });

  test('rich content retains order, table semantics, images and links without executable markup', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/en/insurance-preview?scenario=rich');
    await expect(page.locator('h1')).toHaveCount(1); await expect(page.locator('#contact')).toHaveCount(1);
    const article = page.locator('.insurance-article');
    await expect(article.locator('h2').first()).toHaveText('Cover at a glance');
    await expect(article.locator('a').first()).toHaveAttribute('href', '#article-1');
    const table = page.getByRole('region', { name: 'Coverage comparison' });
    await expect(table.locator('th').first()).toHaveAttribute('rowspan', '2');
    await expect(table.locator('th').nth(1)).toHaveAttribute('colspan', '7');
    expect(await table.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
    await table.focus(); await expect(table).toBeFocused(); await page.keyboard.press('ArrowRight');
    await expect.poll(() => table.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    await expect(article.getByAltText('Coverage diagram')).toHaveAttribute('width', '800');
    await article.getByRole('img', { name: 'Plan illustration', exact: true }).scrollIntoViewIfNeeded();
    await expect(article.locator('.article-image-fallback')).toContainText('Plan illustration');
    await expect(article.getByRole('link', { name: 'Read the policy document' })).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(article.locator('script, iframe, [onclick], [onerror]')).toHaveCount(0);
    expect(await page.evaluate(() => 'articleUnsafe' in window)).toBe(false);
    expect(await article.locator(':scope > *').evaluateAll(elements => elements.map(el => el.tagName))).toEqual(['H2', 'P', 'OL', 'DIV', 'P', 'FIGURE', 'P', 'H2', 'P', 'P', ...Array.from({ length: 6 }, () => ['H3', 'P']).flat()]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });

  test('fallback, missing metadata, text-only and unpublished articles have readable states', async ({ page }) => {
    await page.goto('/lo/insurance-preview');
    await expect(page.locator('.article-language-notice')).toHaveText('ບົດຄວາມນີ້ມີໃຫ້ອ່ານເປັນພາສາອັງກິດ.');
    await expect(page.locator('.insurance-article')).toHaveAttribute('lang', 'en');
    await page.goto('/en/insurance-preview?scenario=unpublished');
    await expect(page.locator('.insurance-overview')).toBeVisible();
    await expect(page.locator('.insurance-article')).toHaveCount(0);
    await expect(page.getByText('Cover for your family, with room to ask questions.', { exact: true })).toHaveCount(1);
    await page.goto('/en/insurance-preview?scenario=missing');
    await expect(page.locator('h1')).toHaveText('Insurance plan');
    await expect(page.locator('.insurance-description')).toHaveCount(0);
    await expect(page.locator('.insurance-insurer-logo .asset-placeholder')).toBeVisible();
    await page.goto('/en/insurance-preview?scenario=text');
    await expect(page.locator('.insurance-article p')).toHaveText(['First paragraph.', 'Second paragraph.']);
  });

  test('contact stays reachable on mobile and short desktop windows', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/en/insurance-preview?scenario=rich');
    const bar = page.locator('.mobile-advisor');
    await expect(bar).toBeVisible();
    await page.getByRole('button', { name: 'Open menu' }).click(); await expect(bar).toBeHidden();
    await page.keyboard.press('Escape'); await expect(bar).toBeVisible();
    await bar.getByRole('button').click(); await expect(page.locator('#contact-title')).toBeFocused(); await expect(bar).toBeHidden();
    await expect(page.locator('#contact button:disabled')).toHaveCount(2);
    expect(await page.locator('footer').evaluate(el => parseFloat(getComputedStyle(el).paddingBottom))).toBeGreaterThanOrEqual(90);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator('#contact')).toHaveAttribute('data-sticky', 'true');
    await page.locator('.insurance-content h2').first().scrollIntoViewIfNeeded();
    expect(await page.locator('#contact').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(104);
    await page.setViewportSize({ width: 1440, height: 350 });
    await expect(page.locator('#contact')).toHaveAttribute('data-sticky', 'false');
    expect(await page.locator('#contact').evaluate(el => getComputedStyle(el).position)).toBe('static');
  });

  for (const locale of ['en', 'lo']) test(`${locale} long content reflows from 320px through desktop and at 200%`, async ({ page }) => {
    await page.goto(`/${locale}/insurance-preview?scenario=long`);
    for (const width of [320, 360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px overflow`).toBe(true);
      expect(await page.locator('h1').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    }
    await page.addStyleTag({ content: '.public-site { zoom: 2; }' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('#contact')).toHaveAttribute('data-sticky', 'false');
  });

  test('temporary page failures support retry', async ({ page, context, baseURL }) => {
    await page.goto('/en/insurance-preview?scenario=error');
    await expect(page.locator('h1')).toHaveText('We couldn’t load this plan');
    await context.addCookies([{ name: 'insurance-fixture-ready', value: 'yes', url: baseURL! }]);
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(page.locator('h1')).toHaveText('Family Health Plan');
  });

  test('slow responses show localized loading feedback', async ({ page }) => {
    await page.goto('/lo/insurance-preview?scenario=loading', { waitUntil: 'commit' });
    await expect(page.getByRole('status').filter({ hasText: 'ກຳລັງໂຫຼດແຜນປະກັນ' })).toBeVisible();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1')).toHaveText('Family Health Plan');
  });
});

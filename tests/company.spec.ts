import { test, expect, type Page } from '@playwright/test';

const populatedId = '193e673e-2659-43d5-8e7c-5300199c3ab5';
const emptyId = 'dbc40007-2c48-4008-a595-3f945c8e07a7';

async function contactSettings(page: Page, data: Record<string, string> = {}) {
  await page.route('**/api/settings?prefix=contact_*', route => route.fulfill({ json: { success: true, data } }));
}

test('company journey carries the homepage category but not the insurer search', async ({ page, request }) => {
  await contactSettings(page);
  const response = await request.get(`/api/insurances?companyId=${populatedId}&locale=en`);
  const { data: products } = await response.json();
  const health = products.filter((product: { category: string }) => product.category === 'health');
  await page.goto('/en?category=health&q=Allianz');
  await page.locator('.insurer-card').first().click();
  await expect(page).toHaveURL(new RegExp(`/en/company/${populatedId}\\?category=health$`));
  await expect(page.locator('h1')).toHaveText('Allianz Insurance Laos (AGL)');
  await expect(page).toHaveTitle('Allianz Insurance Laos (AGL) | MC Broker');
  await expect(page.getByLabel('Search products')).toHaveValue('');
  await expect(page.locator('.product-card')).toHaveCount(health.length);
  const productPath = await page.locator('.product-card').first().getAttribute('href');
  await page.locator('.product-card').first().click();
  await expect(page).toHaveURL(new RegExp(`${productPath}$`));
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('header .header-advisor')).toHaveAttribute('href', '/en#contact');
  await page.goBack();
  await expect(page.locator('.product-card')).toHaveCount(health.length);
});

test('empty and missing companies have localized navigation without fake products', async ({ page }) => {
  await contactSettings(page);
  await page.goto(`/en/company/${emptyId}`);
  await expect(page.locator('h1')).toHaveText('AIA');
  await expect(page.getByRole('heading', { name: 'No products listed yet' })).toBeVisible();
  await expect(page.locator('.product-card')).toHaveCount(0);
  await expect(page.locator('#contact button:disabled')).toHaveCount(2);
  await page.goto('/lo/company/00000000-0000-0000-0000-000000000000');
  await expect(page.locator('html')).toHaveAttribute('lang', 'lo');
  await expect(page.locator('h1')).toHaveText('ບໍລິສັດນີ້ບໍ່ພ້ອມໃຫ້ເບິ່ງ');
  await expect(page.locator('main a[href="/lo#company-list"]')).toBeVisible();
  await expect(page.locator('.mobile-advisor')).toHaveCount(0);
});

test('company advisor links include context in both languages and reset after navigation', async ({ page, baseURL }) => {
  await contactSettings(page, { contact_phone: '+856 20 5555 0101', contact_whatsapp: '+856 20 5555 0102' });
  for (const locale of ['en', 'lo']) {
    await page.goto(`/${locale}/company/${populatedId}?category=health#contact`);
    const link = page.locator('#contact a[href^="https://wa.me/"]');
    await expect(link).toBeVisible();
    const url = new URL((await link.getAttribute('href'))!);
    expect(url.pathname).toBe('/8562055550102');
    expect(url.searchParams.get('text')).toContain('Allianz Insurance Laos (AGL)');
    expect(url.searchParams.get('text')).toContain(`${baseURL}/${locale}/company/${populatedId}`);
    expect(url.searchParams.get('text')).not.toContain('?category=');
    if (locale === 'lo') expect(url.searchParams.get('text')).toContain('ສະບາຍດີ');
    await expect(page.locator('footer a[href^="https://wa.me/"]')).toHaveAttribute('href', url.href);
    await expect(page.locator('header .header-advisor')).toHaveAttribute('href', '#contact');
  }
  await page.locator('header .brand').click();
  await expect(page.locator('.hero-section')).toBeVisible();
  await expect(page.locator('#contact a[href^="https://wa.me/"]')).not.toHaveAttribute('href', /Allianz/);
});

test.describe('isolated company fixtures', () => {
  test.skip(!process.env.COMPANY_FIXTURE_TESTS, 'Requires preview-only fixture route; see tests/fixtures/README.md');

  test.beforeEach(async ({ page }) => {
    await contactSettings(page);
    await page.route('**/_next/image?*', route => route.abort());
  });

  test('combined filters normalize names, preserve order, restore history and clear', async ({ page }) => {
    await page.goto('/en/company-preview?category=health&q=Ｆａｍｉｌｙ');
    await expect(page.locator('.product-card')).toHaveCount(1);
    await expect(page.locator('.product-card h3')).toHaveText('Family Health');
    await page.getByRole('button', { name: 'Vehicle', exact: true }).click();
    await expect(page.locator('.product-card h3')).toHaveText('Family Vehicle');
    await page.goBack();
    await expect(page.locator('.product-card h3')).toHaveText('Family Health');
    await page.goForward();
    await expect(page.locator('.product-card h3')).toHaveText('Family Vehicle');
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect(page.locator('.product-card h3')).toHaveText(['Family Health', 'Family Vehicle', 'Home Care']);
    expect(new URL(page.url()).search).toBe('');
    await page.getByLabel('Search products').fill('nonexistent');
    await expect(page.getByRole('heading', { name: 'No matching products' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters', exact: true }).last().click();
    await expect(page.locator('.product-card')).toHaveCount(3);
  });

  test('unsupported and unoffered categories resolve to All; locale retains query and anchor', async ({ page }) => {
    for (const category of ['unknown', 'travel']) {
      await page.goto(`/en/company-preview?category=${category}`);
      await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.product-card')).toHaveCount(3);
    }
    await page.goto('/en/company-preview?category=health&q=Family#company-products');
    await page.getByRole('combobox', { name: 'Language' }).selectOption('lo');
    await expect(page.locator('html')).toHaveAttribute('lang', 'lo');
    const url = new URL(page.url());
    expect(url.pathname).toBe('/lo/company-preview');
    expect(url.search).toBe('?category=health&q=Family');
    expect(url.hash).toBe('#company-products');
    await expect(page.locator('.product-card')).toHaveCount(1);
  });

  test('a product load can recover without losing company information or filters', async ({ page, context, baseURL }) => {
    await page.goto('/en/company-preview?scenario=products-error&category=health&q=Family');
    await expect(page.locator('h1')).toHaveText('Example Insurance');
    await expect(page.getByRole('heading', { name: 'We couldn’t load the products' })).toBeVisible();
    await context.addCookies([{ name: 'company-fixture-ready', value: 'yes', url: baseURL! }]);
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(page.locator('.product-card h3')).toHaveText('Family Health');
    await expect(page.getByLabel('Search products')).toHaveValue('Family');
    await expect(page).toHaveURL(/category=health&q=Family/);
  });

  test('a profile failure uses an error boundary and supports retry', async ({ page, context, baseURL }) => {
    await page.goto('/en/company-preview?scenario=profile-error');
    await expect(page.getByRole('heading', { name: 'We couldn’t load this insurer' })).toBeVisible();
    await context.addCookies([{ name: 'company-fixture-ready', value: 'yes', url: baseURL! }]);
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(page.locator('h1')).toHaveText('Example Insurance');
    await expect(page.locator('.product-card')).toHaveCount(3);
  });

  test('slow server data shows localized loading feedback before the profile', async ({ page }) => {
    await page.goto('/lo/company-preview?scenario=loading', { waitUntil: 'commit' });
    await expect(page.getByRole('status').filter({ hasText: 'ກຳລັງໂຫຼດບໍລິສັດ' })).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Example Insurance');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('missing metadata and broken assets have usable fallbacks', async ({ page }) => {
    await page.goto('/en/company-preview?scenario=missing');
    await expect(page.locator('h1')).toHaveText('Insurance company');
    await expect(page.locator('.company-description')).toHaveCount(0);
    await expect(page.locator('.company-logo .asset-placeholder')).toBeVisible();
    await expect(page.locator('.product-card').first().locator('.asset-placeholder')).toBeVisible();
    await expect(page.locator('.product-card h3').first()).toHaveText('Insurance plan');
    await expect(page.locator('.product-card .product-description').first()).not.toHaveText('');
    await expect(page.locator('.product-card').first().locator('.product-description')).toHaveCount(0);
    await expect(page.locator('.product-card').first().locator('.product-category')).toHaveText('Insurance');
  });

  test('mobile advisor respects input, menu, contact visibility and footer space', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/en/company-preview');
    const bar = page.locator('.mobile-advisor');
    await expect(bar).toBeVisible();
    await page.getByLabel('Search products').focus();
    await expect(bar).toBeHidden();
    await page.getByLabel('Search products').press('Tab');
    await expect(bar).toBeVisible();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(bar).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(bar).toBeVisible();
    await bar.getByRole('button').click();
    await expect(page.locator('#contact-title')).toBeFocused();
    await expect(bar).toBeHidden();
    expect(await page.locator('footer').evaluate(el => parseFloat(getComputedStyle(el).paddingBottom))).toBeGreaterThanOrEqual(90);
  });

  for (const locale of ['en', 'lo']) {
    test(`${locale} long content reflows without clipping`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${locale}/company-preview?scenario=long`);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('#contact .contact-copy')).toContainText(await page.locator('h1').innerText());
      for (const width of [320, 360, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), `${width}px overflow`).toBe(false);
        await expect(page.locator('h1')).toBeVisible();
        expect(await page.locator('.product-card h3').first().evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      }
      await page.addStyleTag({ content: '.public-site { zoom: 2; }' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    });
  }
});

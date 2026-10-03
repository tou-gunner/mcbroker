import { test, expect, type Page } from '@playwright/test';

const companies = [
  { id: 'acme-health', name: 'Acme Health', description: 'Health and travel options for individuals and families.', logo: '', available_insurances: ['health', 'travel'] },
  { id: 'acme-motor', name: 'Acme Motor', description: 'Vehicle cover for everyday journeys.', logo: '', available_insurances: ['car'] },
  { id: 'grove', name: 'Grove Insurance', description: 'Protection for home and family.', logo: '', available_insurances: ['health', 'home', 'life'] },
];

async function mockData(page: Page, contact: Record<string, string> = {}) {
  await page.route('**/api/companies?*', route => route.fulfill({ json: { success: true, data: companies } }));
  await page.route('**/api/banners', route => route.fulfill({ json: { success: true, data: [] } }));
  await page.route('**/api/settings?*', route => route.fulfill({ json: { success: true, data: new URL(route.request().url()).searchParams.get('prefix') === 'contact_' ? contact : {} } }));
  await page.route('**/_next/image?*', route => route.abort());
}

test('combines normalized search and category filters, restores history, and resets', async ({ page }) => {
  await mockData(page);
  await page.goto('/en?category=health&q=Acme');
  const directory = page.locator('#company-list');
  await expect(directory.locator('.insurer-card')).toHaveCount(1);
  await expect(directory.getByRole('heading', { name: 'Acme Health' })).toBeVisible();
  await page.getByLabel('Search insurers').fill('Ａｃｍｅ');
  await expect(directory.locator('.insurer-card')).toHaveCount(1);
  await directory.getByRole('button', { name: 'Vehicle', exact: true }).click();
  await expect(directory.getByRole('heading', { name: 'Acme Motor' })).toBeVisible();
  await expect(page).toHaveURL(/category=car/);
  await page.goBack();
  await expect(directory.getByRole('heading', { name: 'Acme Health' })).toBeVisible();
  await page.goForward();
  await expect(directory.getByRole('heading', { name: 'Acme Motor' })).toBeVisible();
  await directory.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(directory.locator('.insurer-card')).toHaveCount(3);
  await expect(page.getByLabel('Search insurers')).toHaveValue('');
  expect(new URL(page.url()).search).toBe('');
});

test('category choice moves focus, and locale switching preserves filters and anchor', async ({ page }) => {
  await mockData(page);
  await page.goto('/en?q=Acme#insurance-types');
  await page.locator('#insurance-types').getByRole('button', { name: /Health/ }).click();
  await expect(page.locator('#company-list-title')).toBeFocused();
  await expect(page.locator('.insurer-card')).toHaveCount(1);
  await page.getByRole('combobox', { name: 'Language' }).selectOption('lo');
  await expect(page.locator('html')).toHaveAttribute('lang', 'lo');
  const url = new URL(page.url());
  expect(url.pathname).toBe('/lo');
  expect(url.searchParams.get('category')).toBe('health');
  expect(url.searchParams.get('q')).toBe('Acme');
  expect(url.hash).toBe('#insurance-types');
  await expect(page.locator('.insurer-card')).toHaveCount(1);
  await page.getByRole('combobox', { name: 'ພາສາ' }).selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByLabel('Search insurers')).toHaveValue('Acme');
});

test('unknown categories, no matches, and empty catalogs have distinct recovery paths', async ({ page }) => {
  await mockData(page);
  await page.goto('/en?category=unknown');
  await expect(page.locator('.insurer-card')).toHaveCount(3);
  await expect(page.locator('#company-list').getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Search insurers').fill('No such insurer');
  await expect(page.getByRole('heading', { name: 'No match just yet' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).first().click();
  await expect(page.locator('.insurer-card')).toHaveCount(3);
  await page.route('**/api/companies?*', route => route.fulfill({ json: { success: true, data: [] } }));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'More options are on the way' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Find advisor contact options' })).toHaveAttribute('href', '#contact');
});

test('failed requests can retry without losing entered filters', async ({ page }) => {
  await mockData(page);
  let fail = true;
  await page.route('**/api/companies?*', route => fail
    ? route.fulfill({ status: 503, json: { success: false } })
    : route.fulfill({ json: { success: true, data: companies } }));
  await page.goto('/en?category=health&q=Acme');
  await expect(page.locator('#company-list').getByRole('alert')).toContainText('We couldn’t load the insurers');
  fail = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('.insurer-card')).toHaveCount(1);
  await expect(page.getByLabel('Search insurers')).toHaveValue('Acme');
  await expect(page).toHaveURL(/category=health&q=Acme/);
});

test('missing and invalid contact destinations never create live links', async ({ page }) => {
  await mockData(page, { contact_phone: 'not a number', contact_whatsapp: 'bad', contact_email: 'invalid' });
  await page.goto('/en#contact');
  await expect(page.locator('#contact').getByRole('button', { name: 'Call an advisor' })).toBeDisabled();
  await expect(page.locator('#contact').getByRole('button', { name: 'Chat on WhatsApp' })).toBeDisabled();
  await expect(page.locator('#contact-availability')).toContainText('not available yet');
  await expect(page.locator('a[href^="tel:"], a[href^="mailto:"], a[href^="https://wa.me/"]')).toHaveCount(0);
});

test('phone, email, and localized WhatsApp use the shared settings', async ({ page }) => {
  await mockData(page, { contact_phone: '+856 20 5555 0101', contact_whatsapp: '+856 20 5555 0102', contact_email: 'advisor@example.test' });
  await page.goto('/lo#contact');
  await expect(page.locator('#contact a[href^="tel:"]')).toHaveAttribute('href', 'tel:+8562055550101');
  const link = page.locator('#contact a[href^="https://wa.me/"]');
  await expect(link).toBeVisible();
  const url = new URL((await link.getAttribute('href'))!);
  expect(url.pathname).toBe('/8562055550102');
  expect(url.searchParams.get('text')).toContain('ສະບາຍດີ MC Broker');
  expect(url.searchParams.get('text')).toContain('/lo');
  await expect(page.locator('footer a[href^="https://wa.me/"]')).toHaveAttribute('href', url.href);
  await expect(page.locator('footer a[href^="mailto:"]')).toHaveAttribute('href', 'mailto:advisor@example.test');
});

test('mobile navigation traps focus, restores it, and contact bar respects input and contact visibility', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await mockData(page);
  await page.goto('/en');
  const bar = page.locator('.mobile-advisor');
  await expect(bar).toBeVisible();
  const open = page.getByRole('button', { name: 'Open menu' });
  await open.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(bar).toBeHidden();
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
  await page.getByLabel('Search insurers').focus();
  await expect(bar).toBeHidden();
  await page.getByLabel('Search insurers').press('Tab');
  await expect(bar).toBeVisible();
  await bar.getByRole('button').click();
  await expect(page.locator('#contact-title')).toBeFocused();
  await expect(bar).toBeHidden();
});

test('broken banners retain a placeholder and later slides are not rendered', async ({ page }) => {
  await mockData(page);
  await page.route('**/api/banners', route => route.fulfill({ json: { success: true, data: [
    { id: 'first', imageUrl: 'https://s3.mcins.la/mcins/missing.webp', linkUrl: 'https://example.test/featured' },
    { id: 'second', imageUrl: 'https://s3.mcins.la/mcins/second.webp', linkUrl: 'https://example.test/second' },
  ] } }));
  await page.goto('/en');
  await expect(page.locator('.hero-placeholder-scene')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View featured information' })).toHaveAttribute('href', 'https://example.test/featured');
  await expect(page.locator('a[href="https://example.test/second"]')).toHaveCount(0);
  await expect(page.locator('.hero-section h1')).toHaveText('Protect what matters. Understand your options.');
});

for (const locale of ['en', 'lo']) {
  test(`${locale} layout reflows and stays readable at mobile, tablet, and desktop widths`, async ({ page }) => {
    await mockData(page);
    const longName = locale === 'lo'
      ? 'ບໍລິສັດປະກັນໄພສຳລັບຄອບຄົວ ແລະ ການຄຸ້ມຄອງທຸລະກິດຂອງທ່ານ'
      : 'InsuranceForEveryStageOfYourFamilyAndBusinessLife';
    await page.route('**/api/companies?*', route => route.fulfill({ json: { success: true, data: companies.map((company, index) => index === 0 ? { ...company, name: longName } : company) } }));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}`);
    await expect(page.locator('.insurer-card')).toHaveCount(3);
    for (const width of [320, 360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `horizontal overflow at ${width}px`).toBe(false);
      await expect(page.locator('h1')).toBeVisible();
      const titleFits = await page.locator('.insurer-card h3').first().evaluate(el => el.scrollWidth <= el.clientWidth);
      expect(titleFits, `long insurer name overflows at ${width}px`).toBe(true);
    }
    await page.locator('.faq-list summary').first().click();
    await expect(page.locator('.faq-list details').first()).toHaveAttribute('open', '');
    await page.addStyleTag({ content: '.public-site { zoom: 2; }' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
}

test('contact settings failure remains recoverable without sample destinations', async ({ page }) => {
  await mockData(page);
  await page.route('**/api/settings?prefix=contact_*', route => route.fulfill({ status: 503, json: { success: false } }));
  await page.goto('/en#contact');
  await expect(page.locator('#contact-availability')).toContainText('not available yet');
  await expect(page.locator('#contact button:disabled')).toHaveCount(2);
  await expect(page.locator('a[href^="tel:"], a[href^="mailto:"], a[href^="https://wa.me/"]')).toHaveCount(0);
  await expect(page.locator('.insurer-card')).toHaveCount(3);
});

test('late English hero settings cannot overwrite the selected Lao locale', async ({ page }) => {
  await mockData(page);
  let releaseEnglish: () => void = () => {};
  let requestedEnglish: () => void = () => {};
  const englishPending = new Promise<void>(resolve => { requestedEnglish = resolve; });
  const englishGate = new Promise<void>(resolve => { releaseEnglish = resolve; });
  let completedEnglish: () => void = () => {};
  const englishComplete = new Promise<void>(resolve => { completedEnglish = resolve; });
  await page.route('**/api/settings?prefix=hero_*', async route => {
    const locale = new URL(route.request().url()).searchParams.get('locale');
    if (locale === 'en') {
      requestedEnglish();
      await englishGate;
      try { await route.fulfill({ json: { success: true, data: { hero_title: 'Old English heading' } } }); }
      catch { /* The locale change aborts the old request. */ }
      finally { completedEnglish(); }
    } else {
      await route.fulfill({ json: { success: true, data: { hero_title: 'ປົກປ້ອງສິ່ງສຳຄັນ' } } });
    }
  });
  await page.goto('/en');
  await englishPending;
  await page.getByRole('combobox', { name: 'Language' }).selectOption('lo');
  await expect(page.locator('h1')).toHaveText('ປົກປ້ອງສິ່ງສຳຄັນ');
  releaseEnglish();
  await englishComplete;
  await expect(page.locator('h1')).toHaveText('ປົກປ້ອງສິ່ງສຳຄັນ');
});

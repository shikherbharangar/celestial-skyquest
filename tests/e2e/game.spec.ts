import { test, expect, type Page } from '@playwright/test';

const KEY = 'celestial.field-journal.v1';
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6x8AAAAASUVORK5CYII=',
  'base64',
);
const state = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), KEY);
async function nav(page: Page, label: string) {
  await page.locator('nav:visible').getByRole('button', { name: label, exact: true }).click();
}
async function sampleDiscovery(page: Page) {
  await page.getByRole('button', { name: 'Begin expedition' }).click();
  await page.getByRole('button', { name: 'Try a practice sky' }).click();
  await expect(page.getByRole('heading', { name: 'Hello, Jupiter.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Build a mission' })).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const headings = await page.locator('main h1').boundingBox();
  if (headings) {
    expect(headings.x).toBeGreaterThanOrEqual(0);
    expect(headings.x + headings.width).toBeLessThanOrEqual(
      (page.viewportSize()?.width ?? 1440) + 1,
    );
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('complete discovery → mission → journal loop persists and rewards exactly once', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await sampleDiscovery(page);
  await expect(page.locator('.discovery-xp')).toContainText('+250 XP');
  expect((await state(page)).xp).toBe(250);
  await noOverflow(page);
  await page.getByRole('button', { name: 'Build a mission' }).click();
  await page.getByRole('radio', { name: 'Human' }).check();
  await page.getByRole('radio', { name: 'Explore' }).check();
  await page.getByRole('radio', { name: 'Unhinged' }).check();
  await expect(page.getByText('Mochi has concerns')).toBeVisible();
  await noOverflow(page);
  await page.getByRole('button', { name: 'Create flight plan' }).click();
  await expect(page.getByText(/no solid surface/)).toBeVisible();
  await expect(page.getByText(/speculative/)).toBeVisible();
  await page.getByRole('button', { name: 'Launch this little dream' }).click();
  await expect(page.getByRole('heading', { name: 'And we’re off!' })).toBeVisible();
  expect((await state(page)).xp).toBe(950);
  await nav(page, 'Field journal');
  await expect(
    page.getByRole('button', { name: 'Jupiter, collected, view discovery' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Jupiter, collected, view discovery' }).click();
  await page.getByText('A closer look').click();
  await expect(page.getByText('142,984 km')).toBeVisible();
  await page.getByRole('button', { name: 'Build a mission' }).click();
  await expect(page.getByRole('button', { name: 'Launch this little dream' })).toHaveCount(0);
  await expect(page.getByText('LAUNCHED · SIMULATION')).toBeVisible();
  await page.reload();
  expect((await state(page)).xp).toBe(950);
  expect((await state(page)).missions).toHaveLength(1);
  await nav(page, 'Missions');
  await page.getByRole('button', { name: /MISSION COMET-01/ }).click();
  await expect(page.getByRole('heading', { name: 'And we’re off!' })).toBeVisible();
  await page.getByRole('button', { name: 'Hunt your next wonder' }).click();
  await page.getByLabel('Choose target').selectOption('jupiter');
  await page.getByRole('button', { name: 'Try a practice sky' }).click();
  await expect(page.getByText('AN OLD FRIEND, FOUND AGAIN')).toBeVisible();
  await expect(page.locator('.discovery-xp')).toContainText('+0 XP');
  expect((await state(page)).xp).toBe(950);
  expect(errors).toEqual([]);
});

test('faint-signal recovery and uploaded photo both work without an external AI request', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Begin expedition' }).click();
  await page.getByRole('button', { name: 'Try a faint signal' }).click();
  await expect(page.getByRole('heading', { name: 'SIGNAL WEAK' })).toBeVisible();
  expect((await state(page)).xp).toBe(0);
  await noOverflow(page);
  await page
    .locator('input[type=file]:not([capture])')
    .setInputFiles({ name: 'night.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByRole('heading', { name: 'Hello, Jupiter.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Build a mission' })).toBeVisible();
  expect((await state(page)).xp).toBe(250);
});

test('empty and oversized photos are explained, and abandoning scan never awards XP', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Begin expedition' }).click();
  const upload = page.locator('input[type=file]:not([capture])');
  await upload.setInputFiles({ name: 'empty.png', mimeType: 'image/png', buffer: Buffer.alloc(0) });
  await expect(page.getByRole('alert')).toContainText('empty');
  await upload.setInputFiles({
    name: 'huge.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(16 * 1024 * 1024),
  });
  await expect(page.getByRole('alert')).toContainText('under 15 MB');
  await page.getByRole('button', { name: 'Try a practice sky' }).click();
  await page.getByRole('button', { name: 'Back to tonight' }).click();
  await page.waitForTimeout(1900);
  await expect(page.getByRole('heading', { name: 'Little explorer, big universe.' })).toBeVisible();
  expect((await state(page)).xp).toBe(0);
});

test('collection hints, deep-sky filter, empty missions and progression all work', async ({
  page,
}) => {
  await nav(page, 'Missions');
  await expect(
    page.getByRole('heading', { name: 'Every mission starts with a little curiosity.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Find your first wonder' }).click();
  await expect(page.getByLabel('Choose target')).toHaveValue('jupiter');
  await nav(page, 'Field journal');
  await page.getByRole('button', { name: 'Beyond & nearby' }).click();
  await page.getByRole('button', { name: 'Andromeda, undiscovered, view hint' }).click();
  await expect(page.getByRole('dialog')).toContainText('Under a dark sky');
  await page.getByRole('button', { name: 'Find Andromeda' }).click();
  await expect(page.getByLabel('Choose target')).toHaveValue('andromeda');
  await page.getByRole('button', { name: /Level 1 Skywatcher/ }).click();
  await expect(page.getByRole('dialog')).toContainText('250 XP until Stargazer');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('sky guide calculates local positions after explicit permission', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 28.6, longitude: 77.2 });
  await page.getByRole('button', { name: 'What’s actually up tonight?' }).click();
  await page.getByRole('button', { name: 'Use approximate location' }).click();
  await expect(page.getByText('REAL CALCULATIONS')).toBeVisible();
  await expect(page.getByText(/Updated .*Directions are compass bearings/)).toBeVisible();
  await page.getByRole('button', { name: 'Refresh sky position' }).click();
  await expect(page.getByRole('button', { name: 'Refresh sky position' })).toBeEnabled();
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).not.toMatch(
    /latitude|longitude/,
  );
});

test('demo settings export a journal, control sound and reset only after confirmation', async ({
  page,
}) => {
  await page.getByRole('button', { name: /A COZY STARGAZING GAME/ }).click();
  await expect(page.getByRole('dialog')).toContainText(
    'Practice mode lets you try the game without sending any photos',
  );
  await page.getByRole('button', { name: 'Gentle sound effects OFF' }).click();
  await expect(page.getByRole('button', { name: 'Gentle sound effects ON' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export your field journal' }).click();
  expect((await download).suggestedFilename()).toBe('celestial-field-journal.json');
  await page.getByRole('button', { name: 'Start a fresh journal' }).click();
  await page.getByRole('button', { name: 'Keep my journal' }).click();
  expect((await state(page)).sound).toBe(true);
  await page.getByRole('button', { name: 'Start a fresh journal' }).click();
  await page.getByRole('button', { name: 'Start a fresh journal', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await state(page)).sound).toBe(false);
  expect((await state(page)).xp).toBe(0);
});

test('corrupt saved data recovers without a blank screen', async ({ page }) => {
  await page.evaluate(
    (key) => localStorage.setItem(key, '{"version":1,"xp":999,"discoveries":[null]}'),
    KEY,
  );
  await page.reload();
  await expect(page.getByRole('button', { name: 'Begin expedition' })).toBeVisible();
  expect((await state(page)).xp).toBe(0);
  await noOverflow(page);
});

test('production PWA opens and completes a practice discovery offline', async ({
  page,
  context,
}) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await context.setOffline(true);
  await expect(page.getByText('OFFLINE ADVENTURE')).toBeVisible();
  await page.reload();
  // Chromium 151 resets navigator.onLine on a service-worker reload during
  // emulation, although network requests remain blocked. Verify the actual
  // network failure, then exercise the cached application end to end.
  expect(
    await page.evaluate(async () => {
      try {
        await fetch('/uncached-offline-probe-' + Date.now(), { cache: 'no-store' });
        return false;
      } catch {
        return true;
      }
    }),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await sampleDiscovery(page);
  expect((await state(page)).xp).toBe(250);
});

test('leaving while the practice image downloads never produces a late discovery', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/sample-sky.svg', async (route) => {
    await gate;
    await route.continue();
  });
  await page.getByRole('button', { name: 'Begin expedition' }).click();
  await page.getByRole('button', { name: 'Try a practice sky' }).click();
  await page.getByRole('button', { name: 'Back to tonight' }).click();
  release();
  await page.waitForTimeout(2000);
  expect((await state(page)).xp).toBe(0);
  await expect(page.getByRole('button', { name: 'Begin expedition' })).toBeVisible();
});

test('declining location leaves the practice game available', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_success: unknown, error: (reason: { code: number }) => void) =>
          error({ code: 1 }),
      },
    });
  });
  await page.reload();
  await page.getByRole('button', { name: 'What’s actually up tonight?' }).click();
  await page.getByRole('button', { name: 'Use approximate location' }).click();
  await expect(page.getByRole('status')).toContainText('Location wasn’t available');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Begin expedition' }).click();
  await expect(page.getByRole('button', { name: 'Try a practice sky' })).toBeVisible();
});

test('core screens and settings have no automated WCAG A/AA violations', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const audit = async () => {
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  };
  await audit();
  await page.getByRole('button', { name: /A COZY STARGAZING GAME/ }).click();
  await audit();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Begin expedition' }).click();
  await audit();
  await page.getByRole('button', { name: 'Try a practice sky' }).click();
  await page.getByRole('button', { name: 'Build a mission' }).waitFor();
  await audit();
  await page.getByRole('button', { name: 'Build a mission' }).click();
  await audit();
  await page.getByRole('button', { name: 'Create flight plan' }).click();
  await audit();
  await nav(page, 'Field journal');
  await audit();
});

test('live photo mode sends a resized image, labels the suggestion, and saves its source', async ({
  page,
}) => {
  await page.route('**/api/config', (route) =>
    route.fulfill({
      json: { liveAvailable: true, provider: 'gemma', model: 'gemma-4-26b-a4b-it' },
    }),
  );
  let requestBody:
    | {
        image: { data: string; mimeType: string };
        candidates: string[];
        context: { time: string; latitude?: number };
      }
    | undefined;
  await page.route('**/api/identify', (route) => {
    requestBody = route.request().postDataJSON();
    return route.fulfill({
      json: {
        object: 'moon',
        confidence: 0.94,
        fact: 'server fact',
        rarity: 'Familiar',
        provider: 'gemma',
      },
    });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Begin expedition' }).click();
  await page.getByRole('button', { name: 'Live Gemma', exact: true }).click();
  await expect(page.getByText(/By choosing a photo in Live Gemma mode/)).toBeVisible();
  await page.locator('input[type=file]:not([capture])').setInputFiles('public/icon-192.png');
  await expect(page.getByRole('heading', { name: 'Hello, Moon.' })).toBeVisible();
  await expect(page.locator('.discovery-stamp')).toContainText('AI SUGGESTED MATCH');
  expect(requestBody?.image.mimeType).toBe('image/jpeg');
  expect(requestBody?.candidates.length).toBeGreaterThan(1);
  expect(requestBody?.context.latitude).toBeUndefined();
  expect((await state(page)).discoveries.find((d: { id: string }) => d.id === 'moon').source).toBe(
    'gemma',
  );
  await page.reload();
  await nav(page, 'Field journal');
  await page.getByRole('button', { name: 'Beyond & nearby' }).click();
  await page.getByRole('button', { name: 'Moon, collected, view discovery' }).click();
  await expect(page.getByRole('dialog')).toContainText('AI SUGGESTED MATCH');
});

test('failed live requests do not silently fall back to demo rewards', async ({ page }) => {
  await page.route('**/api/config', (route) => route.fulfill({ json: { liveAvailable: true } }));
  await page.route('**/api/identify', (route) =>
    route.fulfill({
      status: 503,
      json: { error: 'The live sky service is unavailable. Practice mode is still here.' },
    }),
  );
  await page.getByRole('button', { name: 'Begin expedition' }).click();
  await page.getByRole('button', { name: 'Live Gemma', exact: true }).click();
  await page.locator('input[type=file]:not([capture])').setInputFiles('public/icon-192.png');
  await expect(page.getByRole('alert')).toContainText('live sky service is unavailable');
  expect((await state(page)).xp).toBe(0);
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: 'Try a practice sky' }).click();
  await expect(page.getByRole('heading', { name: 'Hello, Jupiter.' })).toBeVisible();
});

test('unconfigured live service leaves practice available and explains its status', async ({
  page,
}) => {
  await page.route('**/api/config', (route) => route.fulfill({ json: { liveAvailable: false } }));
  await page.getByRole('button', { name: 'Begin expedition' }).click();
  await expect(page.getByRole('button', { name: 'Live Gemma', exact: true })).toBeDisabled();
  await expect(page.getByText('Live mode isn’t set up yet')).toBeVisible();
  await page.getByRole('button', { name: 'Check connection' }).click();
  await expect(page.getByRole('button', { name: 'Live Gemma', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Try a practice sky' })).toBeEnabled();
});

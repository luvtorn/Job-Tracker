import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import Module from 'node:module';

if (process.env.PLAYWRIGHT_NODE_PATH) {
  process.env.NODE_PATH = process.env.PLAYWRIGHT_NODE_PATH;
  Module._initPaths();
}

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  throw new Error('Playwright is unavailable. Install it or set PLAYWRIGHT_NODE_PATH to a trusted runtime.');
}

const baseUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

try {
  const locales = [
    { header: 'en-US', locale: 'en', expected: 'Find Your Next', jobsSearch: 'Search jobs\u2026', tableLabel: 'Table' },
    { header: 'pl-PL', locale: 'pl', expected: 'Znajd\u017a swoj\u0105 nast\u0119pn\u0105', jobsSearch: 'Szukaj ofert\u2026', tableLabel: 'Tabela' },
    { header: 'ru-RU', locale: 'ru', expected: '\u041d\u0430\u0439\u0434\u0438\u0442\u0435 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0443\u044e', jobsSearch: '\u041f\u043e\u0438\u0441\u043a \u0432\u0430\u043a\u0430\u043d\u0441\u0438\u0439\u2026', tableLabel: '\u0422\u0430\u0431\u043b\u0438\u0446\u0430' },
  ];

  for (const { header, locale, expected, jobsSearch, tableLabel } of locales) {
    const context = await browser.newContext({
      locale: header,
      extraHTTPHeaders: { 'Accept-Language': header },
    });
    const page = await context.newPage();
    const failures = [];
    page.on('pageerror', (error) => failures.push(`page: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error' && /content security policy|hydration/i.test(message.text())) {
        failures.push(`console: ${message.text()}`);
      }
    });
    page.on('response', (response) => {
      if (response.status() >= 500) failures.push(`http: ${response.status()} ${response.url()}`);
    });

    const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
    assert.equal(response?.status(), 200, `${locale}: home page did not return HTTP 200`);
    assert.equal(await page.locator('html').getAttribute('lang'), locale, `${locale}: incorrect html lang`);
    assert.match(await page.locator('body').innerText(), new RegExp(expected), `${locale}: localized hero is missing`);

    let jobRequests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/jobs?')) jobRequests += 1;
    });
    const jobsResponse = await page.goto(`${baseUrl}/jobs`, { waitUntil: 'networkidle' });
    assert.equal(jobsResponse?.status(), 200, `${locale}: jobs page did not return HTTP 200`);
    assert.equal(await page.locator('input[type="search"]').first().getAttribute('placeholder'), jobsSearch, `${locale}: jobs search is not localized`);
    await page.getByRole('button', { name: tableLabel, exact: true }).click();
    assert.equal(await page.getByRole('button', { name: tableLabel, exact: true }).getAttribute('aria-pressed'), 'true', `${locale}: table view did not activate`);

    const requestsBeforeSearch = jobRequests;
    const searchResponse = page.waitForResponse((response) => response.url().includes('/api/jobs?') && response.url().includes('search=browser-smoke-debounce'));
    await page.locator('input[type="search"]').first().fill('browser-smoke-debounce');
    await searchResponse;
    await page.waitForTimeout(100);
    assert.equal(jobRequests - requestsBeforeSearch, 1, `${locale}: debounced search sent more than one request`);

    assert.deepEqual(failures, [], `${locale}: browser failures\n${failures.join('\n')}`);
    await context.close();
  }
} finally {
  await browser.close();
}

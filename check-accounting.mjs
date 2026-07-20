import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const loginRes = await context.request.post('http://localhost:3001/api/auth/login', {
    data: { identifier: 'business@afribiz.test', password: 'Test1234!' }
  });
  const loginData = await loginRes.json();
  const { accessToken, refreshToken } = loginData.data;

  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate((t) => {
    localStorage.setItem('accessToken', t.accessToken);
    localStorage.setItem('refreshToken', t.refreshToken);
  }, { accessToken, refreshToken });
  await context.addCookies([
    { name: 'accessToken', value: accessToken, domain: 'localhost', path: '/' },
    { name: 'refreshToken', value: refreshToken, domain: 'localhost', path: '/' },
  ]);

  // Monitor ALL console output
  page.on('console', m => console.log('CONSOLE[' + m.type() + ']', m.text().substring(0, 500)));
  page.on('pageerror', e => console.log('PAGE_ERROR:', e.message.substring(0, 500)));
  page.on('requestfailed', r => console.log('REQ_FAIL:', r.url(), r.failure()?.errorText));

  console.log('Navigating to /dashboard/accounting...');
  const resp = await page.goto('http://localhost:3000/dashboard/accounting', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('Response status:', resp?.status());
  await new Promise(r => setTimeout(r, 5000));
  console.log('Final URL:', page.url());

  await browser.close();
}

main().catch(e => console.error('FATAL:', e));

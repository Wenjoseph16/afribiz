import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Login via API
  const loginRes = await context.request.post('http://localhost:3001/api/auth/login', {
    data: { identifier: 'business@afribiz.test', password: 'Test1234!' }
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error('Login failed');
  const { accessToken, refreshToken } = loginData.data;

  // Set auth
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate((t) => {
    localStorage.setItem('accessToken', t.accessToken);
    localStorage.setItem('refreshToken', t.refreshToken);
  }, { accessToken, refreshToken });

  // Now manually set the cookie too
  await context.addCookies([
    { name: 'accessToken', value: accessToken, domain: 'localhost', path: '/' },
    { name: 'refreshToken', value: refreshToken, domain: 'localhost', path: '/' },
  ]);

  // Navigate to dashboard to verify
  await page.goto('http://localhost:3000/dashboard/business', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  console.log('Dashboard URL:', page.url());

  // Test each problematic page
  const pages = [
    '/dashboard/media-commerce',
    '/dashboard/client-intelligence',
    '/dashboard/comments',
    '/dashboard/promotions',
    '/dashboard/promotions/campaigns',
    '/dashboard/statistics',
    '/dashboard/crm/pipeline',
    '/dashboard/crm/automation',
    '/dashboard/attention',
    '/dashboard/growth-engine',
    '/dashboard/growth-coaching',
    '/dashboard/gamification',
    '/dashboard/afriscore',
    '/dashboard/consents',
    '/dashboard/payments',
    '/dashboard/escrow',
    '/dashboard/accounting',
    '/dashboard/alerts',
    '/dashboard/signatures',
    '/dashboard/hybrid-payments',
  ];

  for (const path of pages) {
    const errors = [];
    const apiErrors = [];

    page.on('pageerror', e => errors.push(e.message.substring(0, 300)));
    page.on('response', r => {
      if (r.status() >= 400 && r.url().includes('/api/')) {
        apiErrors.push(r.status() + ' ' + r.url().replace('http://localhost:3001', ''));
      }
    });

    await page.goto('http://localhost:3000' + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2500));

    page.removeAllListeners('pageerror');
    page.removeAllListeners('response');

    const finalUrl = page.url().replace('http://localhost:3000', '');
    console.log('\n' + path);
    console.log('  URL: ' + finalUrl);
    if (errors.length) console.log('  ERR:', errors.slice(0,3).join(' | '));
    if (apiErrors.length) console.log('  API:', apiErrors.slice(0,5).join(' | '));
    if (!errors.length && !apiErrors.length) console.log('  ✓ OK');
  }

  await browser.close();
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });

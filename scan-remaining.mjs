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

  const pages = [
    '/dashboard/consents',
    '/dashboard/payments',
    '/dashboard/escrow',
    '/dashboard/accounting',
    '/dashboard/alerts',
    '/dashboard/signatures',
    '/dashboard/hybrid-payments',
    '/dashboard/promotions',
    '/dashboard/offers',
    '/dashboard/savings',
  ];

  for (const path of pages) {
    const errors = [];
    const apiErrors = [];
    page.on('pageerror', e => errors.push(e.message.substring(0, 300)));
    page.on('response', r => {
      if (r.status() >= 400 && r.url().includes('/api/')) 
        apiErrors.push(r.status() + ' ' + r.url().replace('http://localhost:3001', ''));
    });

    try {
      await page.goto('http://localhost:3000' + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await new Promise(r => setTimeout(r, 3000));
    } catch(e) { errors.push('TIMEOUT'); }

    page.removeAllListeners('pageerror');
    page.removeAllListeners('response');
    console.log(path + ' -> ' + page.url().replace('http://localhost:3000','') + (errors.length ? ' ERR:' + errors.join('|') : '') + (apiErrors.length ? ' API:' + apiErrors.join('|') : ''));
  }

  await browser.close();
  console.log('\nDONE');
}

main().catch(e => console.error(e));

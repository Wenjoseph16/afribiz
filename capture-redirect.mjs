import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const navigations = [];
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      navigations.push({ time: Date.now(), url: frame.url() });
    }
  });

  const responses = [];
  page.on('response', r => {
    if (r.url().includes('/api/')) {
      responses.push({ url: r.url().substring(0, 120), status: r.status() });
    }
  });

  const consoleErrors = [];
  page.on('console', m => {
    if (m.type() === 'error') {
      consoleErrors.push(m.text().substring(0, 300));
    }
  });

  const loginRes = await context.request.post('http://localhost:3001/api/auth/login', {
    data: { identifier: 'business@afribiz.test', password: 'Test1234!' }
  });
  const loginData = await loginRes.json();
  console.log('Login:', loginData.success ? 'OK' : 'FAIL', loginData.error || '');
  const { accessToken, refreshToken } = loginData.data || {};

  // Set cookies at context level
  await context.addCookies([
    { name: 'accessToken', value: accessToken, domain: 'localhost', path: '/' },
    { name: 'refreshToken', value: refreshToken, domain: 'localhost', path: '/' },
  ]);

  const testPages = [
    '/dashboard/accounting',
    '/dashboard/consents',
    '/dashboard/escrow',
    '/dashboard/alerts',
    '/dashboard/signatures',
    '/dashboard/media-commerce',
  ];

  for (const path of testPages) {
    navigations.length = 0;
    responses.length = 0;
    consoleErrors.length = 0;

    console.log('\n=== ' + path + ' ===');
    
    const resp = await page.goto('http://localhost:3000' + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Initial status:', resp?.status());
    
    // Also set localStorage via evaluate
    await page.evaluate((t) => {
      localStorage.setItem('accessToken', t.accessToken);
      localStorage.setItem('refreshToken', t.refreshToken);
      localStorage.setItem('auth-storage', JSON.stringify({
        state: { accessToken: t.accessToken, refreshToken: t.refreshToken, user: null, selectedSpace: 'CLIENT' },
        version: 0,
      }));
    }, { accessToken, refreshToken });
    
    await page.waitForTimeout(4000);
    
    console.log('Final URL:', page.url());
    
    if (navigations.length > 1) {
      console.log('Navigation chain:');
      navigations.forEach(n => console.log('  ' + new Date(n.time).toISOString().slice(11,19) + ' - ' + n.url));
    }
    
    const failed4xx = responses.filter(r => r.status >= 400);
    if (failed4xx.length) {
      console.log('4xx+ API responses:');
      failed4xx.forEach(r => console.log('  ' + r.status + ' ' + r.url));
    }
    
    if (consoleErrors.length) {
      console.log('Console errors:');
      consoleErrors.forEach(e => console.log('  ' + e));
    }
  }

  await browser.close();
}

main().catch(e => console.error('FATAL:', e));

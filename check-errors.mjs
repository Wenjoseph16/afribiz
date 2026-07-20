import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const loginRes = await context.request.post('http://localhost:3001/api/auth/login', {
    data: { identifier: 'business@afribiz.test', password: 'Test1234!' }
  });
  const { data: { accessToken, refreshToken } } = await loginRes.json();

  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate((t) => {
    localStorage.setItem('accessToken', t.accessToken);
    localStorage.setItem('refreshToken', t.refreshToken);
    document.cookie = 'accessToken=' + t.accessToken + '; path=/; max-age=900; SameSite=Lax';
    document.cookie = 'refreshToken=' + t.refreshToken + '; path=/; max-age=604800; SameSite=Lax';
  }, { accessToken, refreshToken });

  // Navigate and capture ALL events
  const pages = [
    '/dashboard/accounting',
    '/dashboard/consents',
    '/dashboard/escrow',
    '/dashboard/alerts',
    '/dashboard/signatures',
  ];

  for (const path of pages) {
    console.log('\n=== ' + path + ' ===');
    
    const consoleMsgs = [];
    const pageErrors = [];
    const reqFails = [];
    const responses = [];
    
    page.on('console', m => { if (m.type() === 'error') consoleMsgs.push(m.text().substring(0, 300)); });
    page.on('pageerror', e => pageErrors.push(e.message.substring(0, 300)));
    page.on('requestfailed', r => reqFails.push(r.url().substring(0, 150) + (r.failure()?.errorText || '')));
    page.on('response', r => { if (r.status() >= 400) responses.push(r.status() + ' ' + r.url().substring(0, 150)); });

    const resp = await page.goto('http://localhost:3000' + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Initial status:', resp?.status());
    
    await new Promise(r => setTimeout(r, 3000));
    
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.removeAllListeners('requestfailed');
    page.removeAllListeners('response');

    console.log('Final URL:', page.url());
    if (consoleMsgs.length) console.log('Console errors:', consoleMsgs.join('\n  '));
    if (pageErrors.length) console.log('Page errors:', pageErrors.join('\n  '));
    if (reqFails.length) console.log('Failed requests:', reqFails.join('\n  '));
    if (responses.length) console.log('4xx+ responses:', responses.join('\n  '));
  }

  await browser.close();
}

main().catch(e => console.error('FATAL:', e));

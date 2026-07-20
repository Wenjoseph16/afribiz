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
    document.cookie = 'accessToken=' + t.accessToken + '; path=/; max-age=900; SameSite=Lax';
    document.cookie = 'refreshToken=' + t.refreshToken + '; path=/; max-age=604800; SameSite=Lax';
  }, { accessToken, refreshToken });

  // Override router.push and router.replace to catch redirects
  await page.evaluate(() => {
    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);
    window.history.pushState = (...args) => {
      console.log('REDIRECT_PUSH:', args[2]);
      return origPush(...args);
    };
    window.history.replaceState = (...args) => {
      console.log('REDIRECT_REPLACE:', args[2]);
      return origReplace(...args);
    };
  });

  page.on('console', m => {
    if (m.text().includes('REDIRECT_') || m.type() === 'error') 
      console.log('[' + m.type() + ']', m.text().substring(0, 500));
  });

  console.log('Testing /dashboard/accounting...');
  await page.goto('http://localhost:3000/dashboard/accounting', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  console.log('Final URL:', page.url());

  await browser.close();
}

main().catch(e => console.error('FATAL:', e));

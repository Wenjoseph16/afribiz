import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Login
  const loginRes = await context.request.post('http://localhost:3001/api/auth/login', {
    data: { identifier: 'business@afribiz.test', password: 'Test1234!' }
  });
  const loginData = await loginRes.json();
  const { accessToken, refreshToken } = loginData.data;

  // Set context cookies
  await context.addCookies([
    { name: 'accessToken', value: accessToken, domain: 'localhost', path: '/' },
    { name: 'refreshToken', value: refreshToken, domain: 'localhost', path: '/' },
  ]);

  const path = '/dashboard/accounting';
  
  // Track ALL requests and responses
  const allRequests = [];
  const allResponses = [];
  const allNavigations = [];
  
  page.on('request', r => allRequests.push({ time: Date.now(), url: r.url(), method: r.method(), type: r.resourceType() }));
  page.on('response', r => allResponses.push({ time: Date.now(), url: r.url(), status: r.status() }));
  page.on('framenavigated', f => { if (f === page.mainFrame()) allNavigations.push({ time: Date.now(), url: f.url() }); });

  // First, set localStorage by visiting a page
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate((t) => {
    localStorage.setItem('accessToken', t.accessToken);
    localStorage.setItem('refreshToken', t.refreshToken);
  }, { accessToken, refreshToken });
  
  // Verify localStorage is set
  const lsCheck1 = await page.evaluate(() => ({
    accessToken: localStorage.getItem('accessToken')?.substring(0, 30),
    refreshToken: localStorage.getItem('refreshToken')?.substring(0, 30),
  }));
  console.log('localStorage after set:', lsCheck1);
  
  // Now navigate to target
  console.log('\nNavigating to', path);
  allRequests.length = 0;
  allResponses.length = 0;
  allNavigations.length = 0;

  const resp = await page.goto('http://localhost:3000' + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Initial status:', resp?.status());
  
  // Check what's in localStorage RIGHT after page loads
  const lsCheck2 = await page.evaluate(() => ({
    accessToken: localStorage.getItem('accessToken')?.substring(0, 30),
    refreshToken: localStorage.getItem('refreshToken')?.substring(0, 30),
  }));
  console.log('localStorage after navigation:', lsCheck2);

  await page.waitForTimeout(5000);
  
  console.log('\nFinal URL:', page.url());
  console.log('\nAll page navigations:');
  allNavigations.forEach(n => console.log('  ' + new Date(n.time).toISOString().slice(11,19) + ' - ' + n.url));

  // Filter 3xx and 4xx+ responses
  const redirects = allResponses.filter(r => r.status >= 300 && r.status < 400);
  const errors = allResponses.filter(r => r.status >= 400);
  
  if (redirects.length) {
    console.log('\nRedirect (3xx) responses:');
    redirects.forEach(r => console.log('  ' + r.status + ' -> ' + r.url.substring(0, 120)));
  }
  if (errors.length) {
    console.log('\nError (4xx+) responses:');
    errors.forEach(r => console.log('  ' + r.status + ' ' + r.url.substring(0, 120)));
  }

  // Check what HTML was loaded at the redirect destination
  console.log('\nCurrent page HTML (first 500 chars):');
  const html = await page.evaluate(() => document.body?.innerHTML?.substring(0, 500) || 'no body');
  console.log(html);

  await browser.close();
}

main().catch(e => console.error('FATAL:', e));

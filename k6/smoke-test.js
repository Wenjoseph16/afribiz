import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

const endpoints = [
  { method: 'GET', url: '/api/health', name: 'health' },
  { method: 'GET', url: '/api/offers?page=1&limit=5', name: 'offers' },
  { method: 'GET', url: '/api/stories', name: 'stories' },
  { method: 'GET', url: '/api/shorts?page=1&limit=5', name: 'shorts' },
  { method: 'GET', url: '/api/lives', name: 'lives' },
];

export default function () {
  for (const ep of endpoints) {
    const res = http.request(ep.method, `${BASE_URL}${ep.url}`);
    const ok = check(res, {
      [`${ep.name} status 200`]: (r) => r.status === 200,
      [`${ep.name} duration < 500ms`]: (r) => r.timings.duration < 500,
    });
    errorRate.add(!ok);
    sleep(1);
  }
}

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const authDuration = new Trend('auth_duration');
const orderDuration = new Trend('order_duration');
const searchDuration = new Trend('search_duration');

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '3m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.001'],
    auth_duration: ['p(95)<500'],
    order_duration: ['p(95)<2000'],
    search_duration: ['p(95)<500'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  const scenarios = [
    () => {
      const res = http.get(`${BASE_URL}/api/health`);
      authDuration.add(res.timings.duration);
      check(res, { 'health status 200': (r) => r.status === 200 });
    },
    () => {
      const res = http.get(`${BASE_URL}/api/offers?page=1&limit=10`);
      searchDuration.add(res.timings.duration);
      check(res, { 'offers status 200': (r) => r.status === 200 });
    },
    () => {
      const res = http.get(`${BASE_URL}/api/stories`);
      searchDuration.add(res.timings.duration);
      check(res, { 'stories status 200': (r) => r.status === 200 });
    },
    () => {
      const res = http.get(`${BASE_URL}/api/shorts?page=1&limit=10`);
      searchDuration.add(res.timings.duration);
      check(res, { 'shorts status 200': (r) => r.status === 200 });
    },
    () => {
      const payload = JSON.stringify({
        email: `loadtest-${__VU}@test.com`,
        password: 'Test123!',
      });
      const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      authDuration.add(res.timings.duration);
      errorRate.add(res.status !== 200);
    },
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();
  sleep(Math.random() * 3 + 1);
}

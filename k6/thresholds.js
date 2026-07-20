export const THRESHOLDS = {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.001'],
  errors: ['rate<0.01'],
};

export const OPTIONS = {
  vus: 1000,
  duration: '30m',
};

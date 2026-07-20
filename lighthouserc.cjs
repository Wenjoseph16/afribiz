module.exports = {
  ci: {
    collect: {
      staticDistDir: './frontend/.next',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/login',
        'http://localhost:3000/signup',
        'http://localhost:3000/pricing',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/dashboard/finance/escrow',
        'http://localhost:3000/dashboard/disputes',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        formFactor: 'desktop',
        screenEmulation: {
          width: 1440,
          height: 900,
          mobile: false,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.5 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

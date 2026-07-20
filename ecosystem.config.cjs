module.exports = {
  apps: [
    {
      name: 'afribiz-backend',
      cwd: './backend',
      script: 'npx',
      args: 'tsx watch src/server.ts',
      interpreter: 'node',
      env: { NODE_ENV: 'development' },
      watch: false,
    },
    {
      name: 'afribiz-frontend',
      cwd: './frontend',
      script: 'npx',
      args: 'next dev -p 3000',
      interpreter: 'node',
      env: { NODE_ENV: 'development' },
      watch: false,
    },
  ],
};

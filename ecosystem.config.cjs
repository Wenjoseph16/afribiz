module.exports = {
  apps: [
    {
      name: 'afribiz-backend',
      cwd: './backend',
      script: '../node_modules/tsx/dist/cli.mjs',
      args: 'watch src/server.ts',
      interpreter: 'node',
      env: { NODE_ENV: 'development' },
      watch: false,
    },
    {
      name: 'afribiz-frontend',
      cwd: './frontend',
      script: '../node_modules/next/dist/bin/next',
      args: 'dev -p 3000',
      interpreter: 'node',
      env: { NODE_ENV: 'development' },
      watch: false,
    },
  ],
};

module.exports = {
  apps: [
    {
      name: 'mcins',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/www/wwwroot/mcins.la',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3075
      },
      error_file: `${process.env.HOME}/pm2/logs/mcins-error.log`,
      out_file: `${process.env.HOME}/pm2/logs/mcins-out.log`,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G'
    }
  ]
};


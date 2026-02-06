module.exports = {
  apps: [
    // 后端API服务器
    {
      name: 'dynamic-api',
      script: '/home/waxiong/dynamic-website/api/server.js',
      interpreter: '/home/waxiong/.nvm/versions/node/v22.22.0/bin/node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8081,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8081,
        HOST: '0.0.0.0'
      },
      error_file: '/home/waxiong/dynamic-website/logs/api-error.log',
      out_file: '/home/waxiong/dynamic-website/logs/api-out.log',
      log_file: '/home/waxiong/dynamic-website/logs/api-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    // 前端服务器
    {
      name: 'dynamic-client',
      script: '/home/waxiong/dynamic-website/client/server.js',
      interpreter: '/home/waxiong/.nvm/versions/node/v22.22.0/bin/node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        CLIENT_PORT: 3000,
        CLIENT_HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        CLIENT_PORT: 3000,
        CLIENT_HOST: '0.0.0.0'
      },
      error_file: '/home/waxiong/dynamic-website/logs/client-error.log',
      out_file: '/home/waxiong/dynamic-website/logs/client-out.log',
      log_file: '/home/waxiong/dynamic-website/logs/client-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ],

  // 部署配置（可选）
  deploy: {
    production: {
      user: 'waxiong',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:xiongyichuan314-bit/AICreateProject.git',
      path: '/home/waxiong/dynamic-website',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
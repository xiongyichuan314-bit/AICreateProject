module.exports = {
  apps: [
    // 后端API服务器
    {
      name: 'dynamic-api',
      script: './api/server.js',
      cwd: '/home/waxiong/Projects/AICreateProject',
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
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    // 前端服务器
    {
      name: 'dynamic-client',
      script: './client/server.js',
      cwd: '/home/waxiong/Projects/AICreateProject',
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
      error_file: './logs/client-error.log',
      out_file: './logs/client-out.log',
      log_file: './logs/client-combined.log',
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
      'post-deploy': 'npm install && pm2 reload config/ecosystem.config.js --env production'
    }
  }
};
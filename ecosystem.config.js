module.exports = {
  apps: [
    {
      name: 'fantamatto-backend',
      script: 'backend/venv/bin/uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8000',
      cwd: '/opt/fantamatto',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PYTHONPATH: '/opt/fantamatto/backend'
      },
      error_file: '/opt/fantamatto/logs/backend-error.log',
      out_file: '/opt/fantamatto/logs/backend-out.log',
      log_file: '/opt/fantamatto/logs/backend-combined.log',
      time: true
    },
    {
      name: 'fantamatto-frontend',
      script: 'yarn',
      args: 'preview',
      cwd: '/opt/fantamatto/frontend',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      error_file: '/opt/fantamatto/logs/frontend-error.log',
      out_file: '/opt/fantamatto/logs/frontend-out.log',
      log_file: '/opt/fantamatto/logs/frontend-combined.log',
      time: true
    }
  ]
}
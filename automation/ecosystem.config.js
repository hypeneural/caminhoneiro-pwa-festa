module.exports = {
  apps: [
    {
      name: "caminhoneiro-automation",
      script: "python",
      args: "-m uvicorn app.main:app --port 8080 --host 127.0.0.1",
      cwd: "./",
      watch: false,
      max_memory_restart: "512M",
      autorestart: true,
      restart_delay: 5000,
      kill_timeout: 50000,
      env: {
        NODE_ENV: "production",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/pm2_error.log",
      out_file: "./logs/pm2_out.log",
      merge_logs: true
    }
  ]
};

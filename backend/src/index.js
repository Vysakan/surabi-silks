import { env } from './config/env.js';
import { testConnection, closePool } from './config/database.js';
import { storage } from './utils/storage.js';
import { createApp } from './app.js';

async function start() {
  await storage.ensureDir();
  await testConnection();
  console.log('Database connected.');

  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down...`);
    server.close(async () => {
      await closePool();
      console.log('Server closed.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

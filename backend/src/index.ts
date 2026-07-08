// Must be first import and first call
import { initSentry } from './config/sentry.js';
initSentry();

import { buildApp } from './app.js';
import { env } from './config/env.js';
import { cleanupExpiredShareTokens, cleanupExpiredInvitations } from './jobs/cleanup.worker.js';

async function main() {
  const app = await buildApp();
  
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`🤖 SpotBot API running on port ${env.PORT}`);

    // Run cleanup on startup and schedule every 24 hours
    cleanupExpiredShareTokens();
    cleanupExpiredInvitations();
    setInterval(cleanupExpiredShareTokens, 24 * 60 * 60 * 1000);
    setInterval(cleanupExpiredInvitations, 24 * 60 * 60 * 1000);

    // Start scan worker in same process
    async function startWorker() {
      try {
        const { startScanWorker } = await import('./jobs/scan.worker.js');
        await startScanWorker();
        console.log('Scan worker started successfully');
      } catch (err) {
        console.error('Failed to start scan worker:', err);
      }
    }
    startWorker();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();

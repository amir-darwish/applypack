import { serve } from '@hono/node-server';
import { config } from '../config';
import { logger } from '../logger';
import { prisma } from '../db';
import { app } from './app';
import { announceReady, onLauncherStop } from '../local/child';
import { stopCliChildren } from '../ai-provider';

const server = serve(
  {
    fetch: app.fetch,
    port: config.WEB_PORT,
    hostname: config.WEB_HOST,
  },
  (info) => {
    logger.info(
      { host: info.address, port: info.port },
      'web: listening',
    );
    announceReady();
  },
);

async function shutdown(signal: string): Promise<void> {
  // A comparison's CLI call in flight would otherwise run on, orphaned, to its timeout (H43).
  logger.info({ signal, cliChildren: stopCliChildren() }, 'web: shutting down');
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 5_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
onLauncherStop((reason) => void shutdown(reason));

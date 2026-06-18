import { Queue } from 'bullmq';
import { redisConnection } from './redis';

export const webhookQueue = new Queue('webhooks', {
  connection: redisConnection.connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type:  'exponential',
      delay: 3_000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail:     { count: 500  },
  },
});
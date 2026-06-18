import { Redis, RedisOptions } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisConnectionConfig = {
    host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname,
    port: Number(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port) || 6379,
    maxRetriesPerRequest: null,
};
export const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.on('connect', ()  => console.log('✅ Redis connected'));

export const redisConnection = { connection: redisConnectionConfig };
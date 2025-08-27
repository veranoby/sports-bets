import { createClient } from "redis";
import { logger } from "./logger";

let redisClient: ReturnType<typeof createClient> | null = null;
let redisAvailable = false;

export const initRedis = async (): Promise<void> => {
  try {
    if (!process.env.REDIS_URL) {
      logger.info("Redis URL not configured, running without cache");
      return;
    }

    redisClient = createClient({ url: process.env.REDIS_URL });

    redisClient.on("error", (err: Error) => {
      logger.warn(`Redis error: ${err.message} - Falling back to database`);
      redisAvailable = false;
    });

    await redisClient.connect();
    redisAvailable = true;
    logger.info("✅ Redis connected successfully");
  } catch (error) {
    logger.warn("Redis connection failed, falling back to database");
    redisAvailable = false;
  }
};

export const getCache = async (key: string): Promise<string | null> => {
  if (!redisAvailable || !redisClient) return null;
  try {
    const value = await redisClient.get(key);
    return value?.toString() || null; // Convertir Buffer a string si es necesario
  } catch {
    return null;
  }
};

export const setCache = async (
  key: string,
  value: string,
  ttl: number = 300
): Promise<void> => {
  if (!redisAvailable || !redisClient) return;
  try {
    await redisClient.setEx(key, ttl, value);
  } catch {
    // Silently fail
  }
};

export const delCache = async (key: string): Promise<void> => {
  if (!redisAvailable || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch {
    // Silently fail
  }
};

export { redisClient, redisAvailable };

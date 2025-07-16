import { createClient } from "redis";
import { logger } from "./logger";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

// Conexión y manejo de errores
redisClient.on("error", (err) => {
  logger.warn(`Redis error: ${err.message} - Falling back to database`);
});

// Conectar al iniciar
(async () => {
  try {
    await redisClient.connect();
    logger.info("✅ Redis connected");
  } catch (err) {
    logger.error("❌ Redis connection failed - Using database fallback");
  }
})();

// Helper functions
export const cacheGet = async (key: string) => {
  try {
    return await redisClient.get(key);
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: string, ttl?: number) => {
  try {
    await redisClient.set(key, value, { EX: ttl });
  } catch {
    // Silently fail
  }
};

export const cacheDel = async (key: string) => {
  try {
    await redisClient.del(key);
  } catch {
    // Silently fail
  }
};

export default redisClient;

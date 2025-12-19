import { streamingConfig, getStreamUrls } from "../config/streaming";
import axios from "axios";
import { logger } from "../config/logger";
import * as fs from "fs";
import * as path from "path";

// Generar clave única de stream
export const generateStreamKey = (eventId: string): string => {
  return `event_${eventId}_${Date.now()}`;
};

// Verificar si el stream está activo
export const checkStreamHealth = async (
  streamKey: string
): Promise<boolean> => {
  try {
    // ✅ PRIMARY CHECK: Verify HLS files exist and are recent
    // This is more reliable than nginx stats which can be unreliable
    const hlsPath = process.env.HLS_PATH || '/var/www/hls';
    const m3u8File = path.join(hlsPath, `${streamKey}.m3u8`);

    if (fs.existsSync(m3u8File)) {
      const stats = fs.statSync(m3u8File);
      const fileAge = Date.now() - stats.mtimeMs;

      // If playlist was modified in last 10 seconds, stream is active
      if (fileAge < 10000) {
        logger.debug(`Stream ${streamKey} detected as active (HLS file age: ${fileAge}ms)`);
        return true;
      } else {
        logger.debug(`Stream ${streamKey} HLS file exists but is stale (age: ${fileAge}ms)`);
      }
    }

    // ✅ FALLBACK: Check nginx-rtmp stats (if primary check fails)
    if (!process.env.STREAM_HEALTH_CHECK_URL) {
      logger.warn("STREAM_HEALTH_CHECK_URL not configured, HLS file check only");
      return false;
    }

    const response = await axios.get(
      `${process.env.STREAM_HEALTH_CHECK_URL}/stat`,
      {
        timeout: 2000,
        validateStatus: () => true,
      }
    );

    // Verificar si el streamKey está en la respuesta
    if (response.status === 200 && typeof response.data === 'string') {
      const isActive = response.data.includes(streamKey);
      if (isActive) {
        logger.debug(`Stream ${streamKey} detected via nginx stats`);
      }
      return isActive;
    }
    return false;
  } catch (error) {
    logger.warn(`Stream health check failed for ${streamKey}:`, error);
    return false;
  }
};

// Obtener URLs de streaming para todas las calidades
export const getStreamUrl = (streamKey: string): string => {
  return getStreamUrls(streamKey).master;
};

// Obtener información del stream
export const getStreamInfo = async (streamKey: string) => {
  const isHealthy = await checkStreamHealth(streamKey);
  const urls = getStreamUrls(streamKey);

  return {
    isActive: isHealthy,
    streamKey,
    urls,
    rtmpUrl: `${streamingConfig.rtmpServer}/${streamKey}`,
    status: isHealthy ? "healthy" : "offline",
  };
};

// Iniciar streaming (placeholder para integración futura)
export const startStreaming = async (eventId: string, streamKey: string) => {
  logger.info(`Starting stream for event ${eventId} with key ${streamKey}`);
  // Aquí iría la lógica para configurar el stream en el servidor RTMP
  return true;
};

// Detener streaming (placeholder para integración futura)
export const stopStreaming = async (streamKey: string) => {
  logger.info(`Stopping stream with key ${streamKey}`);
  // Aquí iría la lógica para detener el stream en el servidor RTMP
  return true;
};

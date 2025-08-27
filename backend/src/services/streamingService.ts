import { streamingConfig, getStreamUrls } from "../config/streaming";
import axios from "axios";
import { logger } from "../config/logger";

// Generar clave única de stream
export const generateStreamKey = (eventId: string): string => {
  return `event_${eventId}_${Date.now()}`;
};

// Verificar si el stream está activo
export const checkStreamHealth = async (
  streamKey: string
): Promise<boolean> => {
  try {
    if (!process.env.STREAM_HEALTH_CHECK_URL) {
      logger.warn("STREAM_HEALTH_CHECK_URL not configured");
      return true; // Asumimos que está bien en desarrollo
    }

    const response = await axios.get(
      `${process.env.STREAM_HEALTH_CHECK_URL}/stat`,
      {
        timeout: 5000,
      }
    );

    // Verificar si el streamKey está en la respuesta
    return response.data.includes(streamKey);
  } catch (error) {
    logger.error("Error checking stream health:", error);
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

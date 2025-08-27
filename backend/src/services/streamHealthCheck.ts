import axios from "axios";
import { logger } from "../config/logger";

// Verificar salud del servidor de streaming
export const checkStreamServerHealth = async (): Promise<boolean> => {
  try {
    if (!process.env.STREAM_HEALTH_CHECK_URL) {
      return true; // En desarrollo asumimos que está funcionando
    }

    const response = await axios.get(process.env.STREAM_HEALTH_CHECK_URL, {
      timeout: 3000,
    });

    return response.status === 200;
  } catch (error) {
    logger.error("Stream server health check failed:", error);
    return false;
  }
};

// Obtener estadísticas del servidor
export const getStreamServerStats = async () => {
  try {
    if (!process.env.STREAM_HEALTH_CHECK_URL) {
      return null;
    }

    const response = await axios.get(
      `${process.env.STREAM_HEALTH_CHECK_URL}/stat`,
      {
        timeout: 5000,
      }
    );

    // Parsear estadísticas del servidor RTMP
    return {
      active: true,
      data: response.data,
    };
  } catch (error) {
    logger.error("Failed to get stream server stats:", error);
    return {
      active: false,
      error: error.message,
    };
  }
};

// Monitor de streams activos
export const getActiveStreams = async (): Promise<string[]> => {
  try {
    const stats = await getStreamServerStats();
    if (!stats || !stats.active) return [];

    // Extraer streamKeys activos del XML/JSON de estadísticas
    // Esto dependerá del formato exacto del servidor RTMP
    const activeStreams: string[] = [];

    // Placeholder - implementar según formato real
    const streamRegex = /stream_key="([^"]+)"/g;
    let match;
    while ((match = streamRegex.exec(stats.data)) !== null) {
      activeStreams.push(match[1]);
    }

    return activeStreams;
  } catch (error) {
    logger.error("Failed to get active streams:", error);
    return [];
  }
};

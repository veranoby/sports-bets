// Configuración para el servicio de streaming
export const streamingConfig = {
  rtmpServer: process.env.STREAM_SERVER_URL || "rtmp://localhost:1935/live",
  hlsPath: "/tmp/hls",
  hlsFragment: 3,
  hlsPlaylistLength: 60,
  maxBitrate: 720,
  supportedQualities: ["720p", "480p", "360p"],
  cdnUrl: process.env.CDN_URL || "https://cdn.example.com",
};

// Generar URL de streaming para diferentes calidades
export const getStreamUrls = (streamKey: string) => {
  return {
    "720p": `${streamingConfig.cdnUrl}/hls/${streamKey}_720p.m3u8`,
    "480p": `${streamingConfig.cdnUrl}/hls/${streamKey}_480p.m3u8`,
    "360p": `${streamingConfig.cdnUrl}/hls/${streamKey}_360p.m3u8`,
    master: `${streamingConfig.cdnUrl}/hls/${streamKey}.m3u8`,
  };
};

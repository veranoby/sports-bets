"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStreamUrls = exports.streamingConfig = void 0;
// Configuración para el servicio de streaming
exports.streamingConfig = {
    rtmpServer: process.env.STREAM_SERVER_URL || "rtmp://localhost:1935/live",
    hlsPath: "/tmp/hls",
    hlsFragment: 3,
    hlsPlaylistLength: 60,
    maxBitrate: 720,
    supportedQualities: ["720p", "480p", "360p"],
    cdnUrl: process.env.CDN_URL || "https://cdn.example.com",
};
// Generar URL de streaming para diferentes calidades
const getStreamUrls = (streamKey) => {
    return {
        "720p": `${exports.streamingConfig.cdnUrl}/hls/${streamKey}_720p.m3u8`,
        "480p": `${exports.streamingConfig.cdnUrl}/hls/${streamKey}_480p.m3u8`,
        "360p": `${exports.streamingConfig.cdnUrl}/hls/${streamKey}_360p.m3u8`,
        master: `${exports.streamingConfig.cdnUrl}/hls/${streamKey}.m3u8`,
    };
};
exports.getStreamUrls = getStreamUrls;

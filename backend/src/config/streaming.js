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
var getStreamUrls = function (streamKey) {
    return {
        "720p": "".concat(exports.streamingConfig.cdnUrl, "/hls/").concat(streamKey, "_720p.m3u8"),
        "480p": "".concat(exports.streamingConfig.cdnUrl, "/hls/").concat(streamKey, "_480p.m3u8"),
        "360p": "".concat(exports.streamingConfig.cdnUrl, "/hls/").concat(streamKey, "_360p.m3u8"),
        master: "".concat(exports.streamingConfig.cdnUrl, "/hls/").concat(streamKey, ".m3u8"),
    };
};
exports.getStreamUrls = getStreamUrls;

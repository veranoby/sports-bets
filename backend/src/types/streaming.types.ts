// Tipos relacionados con el streaming

export interface StreamConfig {
  rtmpServer: string;
  hlsPath: string;
  hlsFragment: number;
  hlsPlaylistLength: number;
  maxBitrate: number;
  supportedQualities: string[];
  cdnUrl: string;
}

export interface StreamUrls {
  "720p": string;
  "480p": string;
  "360p": string;
  master: string;
}

export interface StreamInfo {
  isActive: boolean;
  streamKey: string;
  urls: StreamUrls;
  rtmpUrl: string;
  status: "healthy" | "offline" | "degraded";
}

export interface StreamStats {
  viewers: number;
  duration: number;
  bitrate: number;
  quality: string;
}

export interface StreamEvent {
  type: "stream_started" | "stream_stopped" | "stream_error";
  eventId: string;
  streamKey: string;
  timestamp: Date;
  data?: any;
}

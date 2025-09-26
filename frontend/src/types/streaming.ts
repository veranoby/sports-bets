export interface StreamAnalytics {
  streamId?: string;
  currentViewers: number;
  peakViewers: number;
  averageViewTime: number;
  totalViews: number;
  viewersByRegion: Record<string, number>;
  qualityDistribution: Record<string, number>;
  duration: number;
  bufferRatio: number;
  errorRate: number;
}

export interface ViewerEvent {
  eventId: string;
  event: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

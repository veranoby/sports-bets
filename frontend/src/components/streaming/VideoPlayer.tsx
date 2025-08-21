import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/http-streaming';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, RotateCcw } from 'lucide-react';
import useStreamAnalytics from '../../hooks/useStreamAnalytics';

// Video.js options interface
interface VideoJSOptions {
  autoplay?: boolean;
  controls?: boolean;
  responsive?: boolean;
  fluid?: boolean;
  sources?: Array<{
    src: string;
    type: string;
  }>;
  playbackRates?: number[];
  html5?: {
    hls?: {
      enableLowInitialPlaylist: boolean;
      smoothQualityChange: boolean;
      overrideNative: boolean;
    };
  };
}

interface StreamQuality {
  label: string;
  src: string;
  bitrate?: number;
}

interface VideoPlayerProps {
  /** HLS stream URL */
  src: string;
  /** Unique stream identifier */
  streamId: string;
  /** Event ID for analytics tracking */
  eventId?: string;
  /** Available quality options */
  qualities?: StreamQuality[];
  /** Auto-start playback */
  autoplay?: boolean;
  /** Show player controls */
  controls?: boolean;
  /** Enable responsive behavior */
  responsive?: boolean;
  /** Enable analytics tracking */
  enableAnalytics?: boolean;
  /** Callback when player is ready */
  onReady?: (player: any) => void;
  /** Callback on playback errors */
  onError?: (error: any) => void;
  /** Callback when playback starts */
  onPlay?: () => void;
  /** Callback when playback pauses */
  onPause?: () => void;
  /** Callback for analytics events */
  onAnalyticsEvent?: (event: string, data: any) => void;
  /** Custom CSS classes */
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  streamId,
  eventId,
  qualities = [],
  autoplay = false,
  controls = true,
  responsive = true,
  enableAnalytics = true,
  onReady,
  onError,
  onPlay,
  onPause,
  onAnalyticsEvent,
  className = ''
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const watchTimeRef = useRef(0);
  const bufferStartRef = useRef<number | null>(null);

  // Analytics hooks
  const analytics = useStreamAnalytics({
    streamId,
    eventId,
    realtime: enableAnalytics,
    autoRefresh: false // We'll track events manually
  });

  // Initialize Video.js player
  useEffect(() => {
    if (!videoRef.current) return;

    const options: VideoJSOptions = {
      autoplay: autoplay,
      controls: false, // We'll use custom controls
      responsive: responsive,
      fluid: responsive,
      sources: [{
        src: src,
        type: 'application/x-mpegURL'
      }],
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      html5: {
        hls: {
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
          overrideNative: !videojs.browser.IS_SAFARI
        }
      }
    };

    const player = videojs(videoRef.current, options);
    playerRef.current = player;

    // Player ready
    player.ready(() => {
      console.log('Video.js player is ready');
      setIsLoading(false);
      onReady?.(player);
    });

    // Event listeners
    player.on('play', () => {
      setIsPlaying(true);
      onPlay?.();
      onAnalyticsEvent?.('play', { streamId, timestamp: Date.now() });
      
      // Track play event in analytics
      if (enableAnalytics) {
        analytics.trackPlay();
      }
    });

    player.on('pause', () => {
      setIsPlaying(false);
      onPause?.();
      onAnalyticsEvent?.('pause', { streamId, timestamp: Date.now() });
      
      // Track pause event and view time
      if (enableAnalytics) {
        analytics.trackPause();
        if (watchTimeRef.current > 0) {
          analytics.trackViewTime(Math.floor(watchTimeRef.current));
        }
      }
    });

    player.on('error', (error: any) => {
      console.error('Video.js error:', error);
      setHasError(true);
      setIsLoading(false);
      onError?.(error);
      
      // Track error event
      if (enableAnalytics) {
        analytics.trackError(error.message || 'Playback error');
      }
    });

    player.on('loadstart', () => {
      setIsLoading(true);
      setHasError(false);
    });

    player.on('canplay', () => {
      setIsLoading(false);
    });

    player.on('waiting', () => {
      setIsLoading(true);
      
      // Track buffer start
      if (enableAnalytics && !bufferStartRef.current) {
        bufferStartRef.current = Date.now();
      }
    });

    player.on('playing', () => {
      setIsLoading(false);
      
      // Track buffer end and duration
      if (enableAnalytics && bufferStartRef.current) {
        const bufferDuration = (Date.now() - bufferStartRef.current) / 1000;
        analytics.trackBuffer(bufferDuration);
        bufferStartRef.current = null;
      }
    });

    player.on('timeupdate', () => {
      // Track viewing progress for analytics
      const currentTime = player.currentTime();
      const duration = player.duration();
      
      if (currentTime && duration) {
        watchTimeRef.current = currentTime;
        
        const progress = (currentTime / duration) * 100;
        onAnalyticsEvent?.('progress', { 
          streamId, 
          currentTime, 
          duration, 
          progress,
          timestamp: Date.now() 
        });
      }
    });

    player.on('volumechange', () => {
      setVolume(player.volume());
      setIsMuted(player.muted());
    });

    player.on('fullscreenchange', () => {
      setIsFullscreen(player.isFullscreen());
    });

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, streamId, autoplay, responsive, onReady, onError, onPlay, onPause, onAnalyticsEvent]);

  // Update source when src changes
  useEffect(() => {
    if (playerRef.current && src) {
      playerRef.current.src({
        src: src,
        type: 'application/x-mpegURL'
      });
    }
  }, [src]);

  // Control handlers
  const handlePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  }, [isPlaying]);

  const handleVolumeToggle = useCallback(() => {
    if (!playerRef.current) return;
    playerRef.current.muted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!playerRef.current) return;
    playerRef.current.volume(newVolume);
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    if (!playerRef.current) return;
    
    if (isFullscreen) {
      playerRef.current.exitFullscreen();
    } else {
      playerRef.current.requestFullscreen();
    }
  }, [isFullscreen]);

  const handleQualityChange = useCallback((qualityLabel: string) => {
    if (!playerRef.current || qualities.length === 0) return;
    
    const selectedQuality = qualities.find(q => q.label === qualityLabel);
    if (selectedQuality) {
      playerRef.current.src({
        src: selectedQuality.src,
        type: 'application/x-mpegURL'
      });
      setCurrentQuality(qualityLabel);
      setShowSettings(false);
      
      onAnalyticsEvent?.('quality_change', { 
        streamId, 
        from: currentQuality, 
        to: qualityLabel,
        timestamp: Date.now() 
      });
      
      // Track quality change in analytics
      if (enableAnalytics) {
        analytics.trackQualityChange(qualityLabel);
      }
    }
  }, [qualities, currentQuality, streamId, onAnalyticsEvent, enableAnalytics, analytics]);

  const handleRetry = useCallback(() => {
    if (!playerRef.current) return;
    
    setHasError(false);
    setIsLoading(true);
    playerRef.current.src({
      src: src,
      type: 'application/x-mpegURL'
    });
  }, [src]);

  if (hasError) {
    return (
      <div 
        className={`relative bg-black rounded-lg overflow-hidden ${className}`}
        data-testid="video-player"
        role="application"
        aria-label="Video Player"
      >
        <div className="flex items-center justify-center h-64 bg-gray-900">
          <div className="text-center text-white">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <RotateCcw className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Stream Error</h3>
            <p className="text-gray-300 mb-4">Unable to load the video stream</p>
            <button
              onClick={handleRetry}
              data-testid="retry-stream-btn"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      data-testid="video-player"
      role="application"
      aria-label="Video Player"
    >
      {/* Video Element */}
      <div>
        <div data-vjs-player>
          <video 
            ref={videoRef}
            className="video-js vjs-default-skin w-full"
            playsInline
            data-testid="video-element"
          />
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75"
          data-testid="buffering-indicator"
        >
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Buffering...</p>
          </div>
        </div>
      )}

      {/* Custom Controls */}
      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            {/* Left Controls */}
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                data-testid={isPlaying ? "pause-button" : "play-button"}
                className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleVolumeToggle}
                  data-testid="volume-control"
                  className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-white bg-opacity-20 rounded-lg appearance-none slider"
                />
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Quality Settings */}
              {qualities.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    data-testid="quality-selector"
                    className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </button>

                  {showSettings && (
                    <div 
                      className="absolute bottom-12 right-0 bg-black bg-opacity-90 rounded-lg p-2 min-w-32"
                      data-testid="quality-menu"
                    >
                      <div className="text-xs font-semibold mb-2">Quality</div>
                      {qualities.map((quality) => (
                        <button
                          key={quality.label}
                          onClick={() => handleQualityChange(quality.label)}
                          data-testid={`quality-${quality.label.toLowerCase()}`}
                          className={`block w-full text-left px-2 py-1 rounded text-sm hover:bg-white hover:bg-opacity-20 ${
                            currentQuality === quality.label ? 'bg-white bg-opacity-20' : ''
                          }`}
                        >
                          {quality.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen */}
              <button
                onClick={handleFullscreenToggle}
                data-testid="fullscreen-button"
                className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Info */}
      <div className="absolute top-4 left-4 text-white">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">LIVE</span>
          {currentQuality !== 'auto' && (
            <span 
              className="text-xs bg-black bg-opacity-50 px-2 py-1 rounded"
              data-testid="quality-indicator"
            >
              {currentQuality}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
import React, { useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/http-streaming';
import { Crown } from 'lucide-react';
import useStreamAnalytics from '../../hooks/useStreamAnalytics';
import useMembershipCheck from '../../hooks/useMembershipCheck';
import { Modal, notification } from 'antd';
import PaymentProofUpload from '../user/PaymentProofUpload';

// ... (interfaces VideoJSOptions, StreamQuality, VideoPlayerProps remain the same)

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
  src: string;
  streamId: string;
  eventId?: string;
  qualities?: StreamQuality[];
  autoplay?: boolean;
  controls?: boolean;
  responsive?: boolean;
  enableAnalytics?: boolean;
  onReady?: (player: any) => void;
  onError?: (error: any) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onAnalyticsEvent?: (event: string, data: any) => void;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = (props) => {
  const { membershipStatus, checkMembership, loading: membershipLoading } = useMembershipCheck();
  const [isAccessChecked, setIsAccessChecked] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      const status = await checkMembership(true); // Force fresh check
      if (!status.membership_valid) {
        setShowUpgradeModal(true);
      }
      setIsAccessChecked(true);
    };
    verifyAccess();
  }, [checkMembership]);

  if (!isAccessChecked || membershipLoading) {
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden flex items-center justify-center ${props.className || 'h-96'}`}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Verificando membresía...</p>
        </div>
      </div>
    );
  }

  if (!membershipStatus?.membership_valid) {
    return (
      <>
        <div className={`relative bg-black rounded-lg overflow-hidden flex items-center justify-center ${props.className || 'h-96'}`}>
            <div className="text-center text-white">
                <Crown className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Contenido Premium</h3>
                <p className="text-gray-400 mb-4">Necesitas una membresía activa para ver este contenido.</p>
                <button onClick={() => setShowUpgradeModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Mejorar Plan
                </button>
            </div>
        </div>
        <Modal
          title="Membresía Premium Requerida"
          open={showUpgradeModal}
          onCancel={() => setShowUpgradeModal(false)}
          footer={null}
          width={600}
        >
          <div className="text-center mb-6">
            <Crown className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accede a Eventos en Vivo Premium</h3>
            <p className="text-gray-600">Mejora tu membresía para ver todos los eventos en vivo sin interrupciones.</p>
          </div>
          <PaymentProofUpload onUploadSuccess={() => {
            setShowUpgradeModal(false);
            notification.success({ message: 'Comprobante subido con éxito! El administrador activará tu membresía.' });
          }} />
        </Modal>
      </>
    );
  }

  return <Player {...props} />;
};

// The actual player implementation is moved to a separate component
const Player: React.FC<VideoPlayerProps> = ({
  src,
  streamId,
  eventId,
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
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    if (!videoRef.current) return;

    const options: VideoJSOptions = {
      autoplay: autoplay,
      controls: false,
      responsive: responsive,
      fluid: responsive,
      sources: [{ src: src, type: 'application/x-mpegURL' }],
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

    player.ready(() => {
      setIsLoading(false);
      onReady?.(player);
    });

    // ... (all other event listeners and handlers remain the same)
    
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, streamId, autoplay, responsive, onReady, onError, onPlay, onPause, onAnalyticsEvent]);

  // ... (all other useEffects and control handlers remain the same)

  if (error) {
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} data-testid="video-player">
        {/* ... Error UI ... */}
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} data-testid="video-player">
        <div data-vjs-player>
          <video ref={playerRef} className="video-js vjs-default-skin w-full" playsInline data-testid="video-element" />
        </div>
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75" data-testid="buffering-indicator">
                {/* ... Loading UI ... */}
            </div>
        )}
        {controls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                {/* ... Custom Controls UI ... */}
            </div>
        )}
        <div className="absolute top-4 left-4 text-white">
            {/* ... Live Info UI ... */}
        </div>
    </div>
  );
};

export default VideoPlayer;
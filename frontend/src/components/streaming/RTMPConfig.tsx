import React, { useState, useEffect } from 'react';
import { Copy, Check, Server, Key, Monitor, RefreshCw, AlertTriangle } from 'lucide-react';
import { streamingAPI } from '../../config/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import useSSE from '../../hooks/useSSE';

interface RTMPConfigProps {
  eventId?: string;
  onStreamKeyGenerated?: (streamKey: string) => void;
  className?: string;
}

interface StreamKey {
  streamKey: string;
  rtmpUrl: string;
  eventId: string;
  generatedAt: string;
  validFor: string;
}

interface OBSConfig {
  server: string;
  streamKey: string;
  settings: {
    keyframeInterval: number;
    videoCodec: string;
    audioCodec: string;
    recommendedBitrate: number;
  };
  instructions: string[];
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'error';
  activeStreams: number;
  totalViewers: number;
  serverLoad: number;
  uptime: number;
  rtmpServer: {
    url: string;
    status: string;
    capacity: {
      maxStreams: number;
      currentStreams: number;
    };
  };
}

const RTMPConfig: React.FC<RTMPConfigProps> = ({
  eventId,
  onStreamKeyGenerated,
  className = ''
}) => {
  const [streamKey, setStreamKey] = useState<StreamKey | null>(null);
  const [obsConfig, setOBSConfig] = useState<OBSConfig | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Use SSE hook for stream status updates
  const streamStatusData = useSSE(eventId ? `/api/sse/events/${eventId}/stream` : null, [eventId]);

  // Update stream status when SSE data changes
  useEffect(() => {
    if (streamStatusData.data) {
      setStreamStatus(streamStatusData.data.status);
    }
  }, [streamStatusData.data]);

  // Fetch system health on mount
  useEffect(() => {
    fetchSystemHealth();
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const response = await streamingAPI.getSystemStatus();
      setSystemHealth(response.data);
    } catch (err: any) {
      console.error('Failed to fetch system health:', err);
      setError('Failed to load system status');
    }
  };

  const generateStreamKey = async () => {
    if (!eventId) {
      setError('Event ID is required to generate stream key');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const response = await streamingAPI.generateStreamKey({ eventId });
      setStreamKey(response.data);
      
      if (onStreamKeyGenerated) {
        onStreamKeyGenerated(response.data.streamKey);
      }

      // Fetch OBS configuration for the new key
      await fetchOBSConfig(response.data.streamKey);
    } catch (err: any) {
      setError(err.message || 'Failed to generate stream key');
    } finally {
      setGenerating(false);
    }
  };

  const fetchOBSConfig = async (key: string) => {
    try {
      const response = await streamingAPI.getOBSConfig(key);
      setOBSConfig(response.data);
    } catch (err: any) {
      console.error('Failed to fetch OBS config:', err);
    }
  };

  const revokeStreamKey = async () => {
    if (!streamKey) return;

    try {
      setLoading(true);
      setError(null);

      await streamingAPI.revokeStreamKey(streamKey.streamKey);
      setStreamKey(null);
      setOBSConfig(null);
      
      // Refresh system health
      await fetchSystemHealth();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke stream key');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'degraded': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Health Status */}
      {systemHealth && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Server className="w-5 h-5 mr-2" />
              RTMP Server Status
            </h3>
            <button
              onClick={fetchSystemHealth}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-3 rounded border ${getHealthStatusColor(systemHealth.status)}`}>
              <div className="text-sm font-medium">Server Status</div>
              <div className="text-lg font-semibold capitalize">{systemHealth.status}</div>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400">
              <div className="text-sm font-medium">Active Streams</div>
              <div className="text-lg font-semibold">
                {systemHealth.activeStreams} / {systemHealth.rtmpServer.capacity.maxStreams}
              </div>
            </div>

            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded text-purple-400">
              <div className="text-sm font-medium">Total Viewers</div>
              <div className="text-lg font-semibold">{systemHealth.totalViewers.toLocaleString()}</div>
            </div>

            <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded text-gray-400">
              <div className="text-sm font-medium">Server Load</div>
              <div className="text-lg font-semibold">{Math.round(systemHealth.serverLoad * 100)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Stream Key Generation */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Stream Key Management
          </h3>
          
          {streamKey && (
            <button
              onClick={revokeStreamKey}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Revoking...' : 'Revoke Key'}
            </button>
          )}
        </div>

        {!streamKey ? (
          <div className="text-center py-8">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Generate a stream key to start streaming</p>
            <button
              onClick={generateStreamKey}
              disabled={generating || !eventId}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                'Generate Stream Key'
              )}
            </button>
            {!eventId && (
              <p className="text-yellow-400 text-sm mt-2">Event ID required</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stream Key Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Stream Key
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={streamKey.streamKey}
                    readOnly
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(streamKey.streamKey, 'streamKey')}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Copy stream key"
                  >
                    {copiedField === 'streamKey' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  RTMP URL
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={streamKey.rtmpUrl}
                    readOnly
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(streamKey.rtmpUrl, 'rtmpUrl')}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Copy RTMP URL"
                  >
                    {copiedField === 'rtmpUrl' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Generated: {new Date(streamKey.generatedAt).toLocaleString()}</span>
              <span>Valid for: {streamKey.validFor}</span>
            </div>
          </div>
        )}
      </div>

      {/* OBS Studio Configuration */}
      {obsConfig && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white flex items-center mb-4">
            <Monitor className="w-5 h-5 mr-2" />
            OBS Studio Configuration
          </h3>

          <div className="space-y-4">
            {/* Quick Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Server
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={obsConfig.server}
                    readOnly
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(obsConfig.server, 'server')}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedField === 'server' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Recommended Bitrate
                </label>
                <input
                  type="text"
                  value={`${obsConfig.settings.recommendedBitrate} kbps`}
                  readOnly
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Setup Instructions */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Setup Instructions:</h4>
              <ol className="space-y-1 text-sm text-gray-400">
                {obsConfig.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-400 mr-2">{index + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Advanced Settings */}
            <div className="pt-4 border-t border-gray-600">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Recommended Settings:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Video Codec:</span>
                  <div className="text-white font-medium">{obsConfig.settings.videoCodec}</div>
                </div>
                <div>
                  <span className="text-gray-400">Audio Codec:</span>
                  <div className="text-white font-medium">{obsConfig.settings.audioCodec}</div>
                </div>
                <div>
                  <span className="text-gray-400">Keyframe Interval:</span>
                  <div className="text-white font-medium">{obsConfig.settings.keyframeInterval}s</div>
                </div>
                <div>
                  <span className="text-gray-400">Quality:</span>
                  <div className="text-white font-medium">720p @ 30fps</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default RTMPConfig;
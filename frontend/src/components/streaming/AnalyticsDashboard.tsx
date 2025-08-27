import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Eye, 
  Clock, 
  TrendingUp, 
  Globe, 
  Monitor, 
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  BarChart3,
  Activity
} from 'lucide-react';
import useStreamAnalytics from '../../hooks/useStreamAnalytics';
import LoadingSpinner from '../shared/LoadingSpinner';

interface AnalyticsDashboardProps {
  streamId?: string;
  eventId?: string;
  className?: string;
  compact?: boolean;
  realtime?: boolean;
  refreshInterval?: number;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  streamId,
  eventId,
  className = '',
  compact = false,
  realtime = true,
  refreshInterval = 30000
}) => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('1h');
  const [showDetails, setShowDetails] = useState(false);

  const {
    analytics,
    loading,
    error,
    isConnected,
    hasBufferedEvents,
    fetchAnalytics,
    refresh,
    clearError
  } = useStreamAnalytics({
    streamId,
    eventId,
    autoRefresh: !realtime, // Don't auto-refresh if using realtime
    refreshInterval,
    realtime
  });

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Get connection status indicator
  const ConnectionStatus = () => {
    if (!realtime) return null;

    return (
      <div className="flex items-center space-x-2 text-sm">
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-green-400">Live</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-red-400">Disconnected</span>
          </>
        )}
        {hasBufferedEvents && (
          <span className="text-yellow-400 text-xs">(Buffered)</span>
        )}
      </div>
    );
  };

  if (loading && !analytics) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner text="Loading analytics..." />
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Analytics Error</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
          <button
            onClick={() => {
              clearError();
              refresh();
            }}
            className="ml-2 p-2 text-red-400 hover:text-red-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`p-6 text-center text-gray-400 ${className}`}>
        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No analytics data available</p>
      </div>
    );
  }

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    trend, 
    color = 'blue' 
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'stable';
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      green: 'bg-green-500/10 border-green-500/20 text-green-400',
      yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
      red: 'bg-red-500/10 border-red-500/20 text-red-400',
      purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      gray: 'bg-gray-500/10 border-gray-500/20 text-gray-400'
    };

    return (
      <div className={`p-4 border rounded-lg ${colorClasses[color]}`}>
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-5 h-5" />
          {trend && (
            <TrendingUp 
              className={`w-4 h-4 ${
                trend === 'up' ? 'text-green-400' : 
                trend === 'down' ? 'text-red-400 rotate-180' : 
                'text-gray-400'
              }`} 
            />
          )}
        </div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm opacity-75">{title}</div>
        {subtitle && (
          <div className="text-xs opacity-60 mt-1">{subtitle}</div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Activity className="w-6 h-6 mr-2" />
            {compact ? 'Analytics' : 'Stream Analytics'}
          </h2>
          <ConnectionStatus />
        </div>

        <div className="flex items-center space-x-2">
          {!compact && (
            <select
              value={timeRange}
              onChange={(e) => {
                const newRange = e.target.value as '1h' | '24h' | '7d' | '30d';
                setTimeRange(newRange);
                fetchAnalytics(newRange);
              }}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          )}

          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className={`grid gap-4 ${
        compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        <StatCard
          icon={Users}
          title="Current Viewers"
          value={analytics.currentViewers.toLocaleString()}
          color="green"
          trend="up"
        />

        <StatCard
          icon={Eye}
          title="Peak Viewers"
          value={analytics.peakViewers.toLocaleString()}
          color="blue"
        />

        <StatCard
          icon={Clock}
          title="Stream Duration"
          value={formatDuration(analytics.duration)}
          color="purple"
        />

        <StatCard
          icon={Users}
          title="Total Views"
          value={analytics.totalViews.toLocaleString()}
          subtitle="Unique viewers"
          color="yellow"
        />
      </div>

      {/* Quality and Performance Metrics */}
      {!compact && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StatCard
            icon={Monitor}
            title="Buffer Ratio"
            value={formatPercentage(analytics.bufferRatio)}
            subtitle="Lower is better"
            color={analytics.bufferRatio > 0.1 ? 'red' : analytics.bufferRatio > 0.05 ? 'yellow' : 'green'}
          />

          <StatCard
            icon={AlertCircle}
            title="Error Rate"
            value={formatPercentage(analytics.errorRate)}
            subtitle="Connection issues"
            color={analytics.errorRate > 0.05 ? 'red' : analytics.errorRate > 0.02 ? 'yellow' : 'green'}
          />

          <StatCard
            icon={Clock}
            title="Avg. View Time"
            value={formatDuration(analytics.averageViewTime)}
            subtitle="Per viewer session"
            color="gray"
          />
        </div>
      )}

      {/* Detailed Analytics */}
      {!compact && (
        <>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white hover:bg-gray-800/70 transition-colors flex items-center justify-center space-x-2"
          >
            <BarChart3 className="w-5 h-5" />
            <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
          </button>

          {showDetails && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Viewer Distribution by Region */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Viewers by Region
                </h3>
                <div className="space-y-3">
                  {Object.entries(analytics.viewersByRegion).map(([region, count]) => (
                    <div key={region} className="flex items-center justify-between">
                      <span className="text-gray-300">{region}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ 
                              width: `${(count / Math.max(...Object.values(analytics.viewersByRegion))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-white font-medium w-12 text-right">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality Distribution */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Monitor className="w-5 h-5 mr-2" />
                  Quality Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(analytics.qualityDistribution).map(([quality, count]) => (
                    <div key={quality} className="flex items-center justify-between">
                      <span className="text-gray-300">{quality}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full"
                            style={{ 
                              width: `${(count / Math.max(...Object.values(analytics.qualityDistribution))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-white font-medium w-12 text-right">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="flex items-center p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button
            onClick={clearError}
            className="ml-auto p-1 hover:bg-yellow-500/10 rounded transition-colors"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
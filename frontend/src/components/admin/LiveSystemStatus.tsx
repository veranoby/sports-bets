import React from 'react';
import useSSE from '../../hooks/useSSE';
import type { SSEEvent, ConnectionStatus } from '../../hooks/useMultiSSE'; // Re-using types

// Assuming these types for the data payload from the 'admin_system' channel
interface SystemStatusData {
  cpuUsage: number;
  memoryUsage: number;
  dbLatency: number;
}

interface SystemHealthBadgeProps {
  status: ConnectionStatus;
}

const SystemHealthBadge: React.FC<SystemHealthBadgeProps> = ({ status }) => {
  const statusConfig = {
    connecting: { text: 'Connecting', color: 'bg-yellow-400' },
    connected: { text: 'Connected', color: 'bg-green-500' },
    disconnected: { text: 'Disconnected', color: 'bg-gray-400' },
    error: { text: 'Error', color: 'bg-red-500' },
  };

  const { text, color } = statusConfig[status];

  return (
    <div className="flex items-center">
      <span className={`h-3 w-3 rounded-full ${color} mr-2`}></span>
      <span>Live Status: {text}</span>
    </div>
  );
};

const LiveSystemStatus: React.FC = () => {
    const { lastEvent, status, error } = useSSE<SystemStatusData>('/api/sse/admin/system');

  const renderValue = (value: number | undefined, unit: string) => {
    if (value === undefined) return <span className="text-gray-400">N/A</span>;
    return <span className="font-semibold">{value.toFixed(2)}{unit}</span>;
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-gray-800">System Health</h3>
        <SystemHealthBadge status={status} />
      </div>
      {error && (
        <div className="text-red-600 text-sm mb-2">Error: {error.message}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-600">CPU Usage</p>
          {renderValue(lastEvent?.data?.cpuUsage, '%')}
        </div>
        <div>
          <p className="text-sm text-gray-600">Memory Usage</p>
          {renderValue(lastEvent?.data?.memoryUsage, '%')}
        </div>
        <div>
          <p className="text-sm text-gray-600">DB Latency</p>
          {renderValue(lastEvent?.data?.dbLatency, 'ms')}
        </div>
      </div>
    </div>
  );
};

export default LiveSystemStatus;

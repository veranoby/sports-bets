import React, { useState, useEffect } from "react";
import useMultiSSE from "../../hooks/useMultiSSE";
import type { SSEEvent, MultiSSEState } from "../../hooks/useMultiSSE";

// Define types for the data payloads from different channels
interface FightStatusData {
  fightId: string;
  status: "upcoming" | "betting" | "live" | "completed";
  title: string;
}

interface StreamViewerData {
  eventId: string;
  viewerCount: number;
}

interface BetData {
  betId: string;
  amount: number;
  type: "PAGO" | "DOY";
}

const LiveEventMonitor: React.FC = () => {
  const channels = {
    fights: "/api/sse/admin/fights",
    streaming: "/api/sse/admin/streaming",
    bets: "/api/sse/admin/bets",
  };

  const sseState = useMultiSSE<FightStatusData | StreamViewerData | BetData>(
    channels,
  );

  const [fights, setFights] = useState<Record<string, FightStatusData>>({});
  const [streams, setStreams] = useState<Record<string, StreamViewerData>>({});
  const [latestBet, setLatestBet] = useState<BetData | null>(null);

  useEffect(() => {
    const fightEvent = sseState.fights?.lastEvent;
    if (fightEvent && fightEvent.type === "FIGHT_STATUS_UPDATE") {
      const fightData = fightEvent.data as FightStatusData;
      setFights((prevFights) => ({
        ...prevFights,
        [fightData.fightId]: fightData,
      }));
    }

    const streamEvent = sseState.streaming?.lastEvent;
    if (streamEvent && streamEvent.type === "VIEWER_COUNT_UPDATE") {
      const streamData = streamEvent.data as StreamViewerData;
      setStreams((prevStreams) => ({
        ...prevStreams,
        [streamData.eventId]: streamData,
      }));
    }

    const betEvent = sseState.bets?.lastEvent;
    if (
      betEvent &&
      (betEvent.type === "NEW_BET" || betEvent.type === "PAGO_PROPOSAL")
    ) {
      setLatestBet(betEvent.data as BetData);
    }
  }, [sseState]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-red-500";
      case "betting":
        return "bg-green-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-3">
        Live Event Monitor
      </h3>

      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700">Fights</h4>
          <div className="mt-2 space-y-2">
            {Object.values(fights).map((fight) => (
              <div
                key={fight.fightId}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span>{fight.title}</span>
                <span
                  className={`px-2 py-1 text-xs text-white rounded-full ${getStatusColor(fight.status)}`}
                >
                  {fight.status}
                </span>
              </div>
            ))}
            {Object.keys(fights).length === 0 && (
              <p className="text-gray-400 text-sm">No fight updates yet.</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">Streaming</h4>
          <div className="mt-2 space-y-2">
            {Object.values(streams).map((stream) => (
              <div
                key={stream.eventId}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span>Event: {stream.eventId}</span>
                <span>Viewers: {stream.viewerCount}</span>
              </div>
            ))}
            {Object.keys(streams).length === 0 && (
              <p className="text-gray-400 text-sm">No stream updates yet.</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">Latest Bet</h4>
          {latestBet ? (
            <div className="p-2 bg-gray-50 rounded">
              <span>
                {latestBet.type} of ${latestBet.amount}
              </span>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No new bets.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveEventMonitor;

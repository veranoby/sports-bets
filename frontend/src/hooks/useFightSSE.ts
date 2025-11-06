import { useState, useEffect, useCallback, useRef } from "react";
import { useSSE } from "./useSSE";
import type { EventSourcePolyfill } from "event-source-polyfill";

interface FightSSEData {
  fightId?: string;
  eventId?: string;
  fightNumber?: number;
  status?: "upcoming" | "betting" | "live" | "completed" | "cancelled";
  result?: string;
  redCorner?: string;
  blueCorner?: string;
  timestamp: Date;
}

interface UseFightSSEReturn {
  fightStatus: string | null;
  availableBets: any[];
  eventListeners: {
    onBettingOpened?: (data: FightSSEData) => void;
    onBettingClosed?: (data: FightSSEData) => void;
    onFightCompleted?: (data: FightSSEData) => void;
    onNewBet?: (data: FightSSEData) => void;
    onError?: (error: any) => void;
  };
  sseStatus: "connected" | "connecting" | "disconnected" | "error";
  error: string | null;
  refreshBets: () => void;
}

const useFightSSE = (
  fightId?: string,
  eventListeners: UseFightSSEReturn["eventListeners"] = {},
): UseFightSSEReturn => {
  const [fightStatus, setFightStatus] = useState<string | null>(null);
  const [availableBets, setAvailableBets] = useState<any[]>([]);
  const [sseStatus, setSseStatus] =
    useState<UseFightSSEReturn["sseStatus"]>("connecting");
  const [error, setError] = useState<string | null>(null);

  const listenersRef = useRef(eventListeners);
  useEffect(() => {
    listenersRef.current = eventListeners;
  }, [eventListeners]);

  // Initialize SSE connection for fight-related events
  const { lastEvent } = useSSE(
    fightId ? `/api/sse/fights/${fightId}` : null,
    {
      heartbeat: true,
      reconnect: true,
      reconnectInterval: 5000,
      maxRetries: 5,
    },
    (status) => setSseStatus(status as UseFightSSEReturn["sseStatus"]),
  );

  useEffect(() => {
    if (lastEvent && fightId) {
      const { type, data } = lastEvent;

      // Update fight status if event is related to this fight
      if (data.fightId === fightId) {
        switch (type) {
          case "BETTING_WINDOW_OPENED":
            setFightStatus("betting");
            listenersRef.current.onBettingOpened?.(data);
            break;

          case "BETTING_WINDOW_CLOSED":
            setFightStatus("live");
            listenersRef.current.onBettingClosed?.(data);
            break;

          case "FIGHT_COMPLETED":
            setFightStatus("completed");
            listenersRef.current.onFightCompleted?.(data);
            break;

          case "NEW_BET":
            listenersRef.current.onNewBet?.(data);
            // Refresh bets when new bet is created
            setTimeout(() => {
              listenersRef.current.onNewBet?.(data);
            }, 500);
            break;

          default:
            console.log(`Unknown SSE event type for fight ${fightId}:`, type);
        }
      }
    }
  }, [lastEvent, fightId]);

  const refreshBets = useCallback(() => {
    // This would trigger bet refresh from API
    console.log("Refreshing bets for fight:", fightId);
  }, [fightId]);

  return {
    fightStatus,
    availableBets,
    eventListeners,
    sseStatus,
    error,
    refreshBets,
  };
};

export default useFightSSE;

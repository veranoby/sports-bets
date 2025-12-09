// frontend/src/pages/user/Bets.tsx - Refactored for modern UI and 2-column layout
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  TrendingUp,
  DollarSign,
  Award,
  Plus,
  Zap,
  History,
  Trophy,
  AlertCircle,
} from "lucide-react";

import { useBets, useWallet } from "../../hooks/useApi";
import { eventsAPI } from "../../services/api"; // Added for live events
import BetCard from "../../components/user/BetCard";
import BettingPanel from "../../components/user/BettingPanel";
import CreateBetModal from "../../components/user/CreateBetModal";
import ProposalNotifications from "../../components/user/ProposalNotifications";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { useWebSocketListener } from "../../hooks/useWebSocket";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";

import type { Bet, EventData, Fight } from "../../types";

// Tipos para las propuestas P2P
interface ProposalReceivedData {
  newProposal: Bet;
}
interface ProposalAcceptedData {
  proposalId: string;
}
interface ProposalRejectedData {
  proposalId: string;
}
interface BetProposalUpdateData {
  proposalId: string;
  updates: Partial<Bet>;
}
interface PagoProposedData {
  newBet: Bet;
}

export default function UserBets() {
  const { isBettingEnabled } = useFeatureFlags();
  const navigate = useNavigate();

  // Estados principales
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Estados para Live Event / Betting Panel
  const [liveEvent, setLiveEvent] = useState<EventData | null>(null);
  const [currentFight, setCurrentFight] = useState<Fight | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);

  // API Hooks
  const { bets, loading, fetchMyBets, cancelBet, acceptBet } = useBets();

  // Use ref for bets to handle WebSocket updates
  const betsRef = useRef<Bet[]>([]);
  const setBetsRef = useRef<React.Dispatch<React.SetStateAction<Bet[]>>>(
    () => {},
  );

  useWallet();

  // Estados para estadísticas
  const [betStats, setBetStats] = useState({
    totalBets: 0,
    activeBets: 0,
    wonBets: 0,
    lostBets: 0,
    totalWon: 0,
    totalLost: 0,
    winRate: 0,
    netProfit: 0,
  });

  // Fetch Live Event Logic
  useEffect(() => {
    const fetchLiveContext = async () => {
      setLoadingLive(true);
      try {
        // Fetch active events
        const response = await eventsAPI.getAll({ category: "live", limit: 1 });
        if (response.success && response.data) {
          const events =
            (response.data as { events?: EventData[] }).events || [];
          if (events.length > 0) {
            const event = events[0];
            setLiveEvent(event);

            // Find active fight within the event
            // Logic: Look for status='betting' or 'live', otherwise 'upcoming' with lowest number?
            // Simplified: Just look for active betting or live fight
            const activeFight = event.fights?.find(
              (f) => f.status === "betting" || f.status === "live",
            );

            if (activeFight) {
              setCurrentFight(activeFight);
            } else if (event.fights && event.fights.length > 0) {
              // Fallback to first upcoming fight if no active fight
              const nextFight =
                event.fights.find((f) => f.status === "upcoming") ||
                event.fights[0];
              setCurrentFight(nextFight);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching live event context:", error);
      } finally {
        setLoadingLive(false);
      }
    };

    fetchLiveContext();
  }, []);

  // Update betsRef when bets change
  useEffect(() => {
    betsRef.current = bets.map((bet) => ({
      ...bet,
      id: bet.id,
      amount: bet.amount,
      status: bet.status as any,
      fightId: bet.fightId,
      side: bet.side,
      potentialWin: (bet as any).potentialWin || 0,
      userId: bet.userId || "",
      updatedAt: (bet as any).updatedAt || new Date().toISOString(),
      result: (bet.result as "win" | "loss") || undefined,
      choice: bet.choice || "",
      createdAt: bet.createdAt || new Date().toISOString(),
    }));
  }, [bets]);

  // Listeners WebSocket (P2P)
  const handleProposalReceived = useCallback((data: ProposalReceivedData) => {
    setBetsRef.current((prev) => [...prev, data.newProposal]);
  }, []);
  const handleProposalAccepted = useCallback((data: ProposalAcceptedData) => {
    setBetsRef.current((prev) =>
      prev.map((bet) =>
        bet.id === data.proposalId
          ? { ...bet, status: "accepted" as any }
          : bet,
      ),
    );
  }, []);
  const handleProposalRejected = useCallback((data: ProposalRejectedData) => {
    setBetsRef.current((prev) =>
      prev.filter((bet) => bet.id !== data.proposalId),
    );
  }, []);
  const handleBetProposalUpdate = useCallback((data: BetProposalUpdateData) => {
    setBetsRef.current((prev) =>
      prev.map((bet) =>
        bet.id === data.proposalId ? { ...bet, ...data.updates } : bet,
      ),
    );
  }, []);
  const handlePagoProposed = useCallback((data: PagoProposedData) => {
    setBetsRef.current((prev) => [...prev, data.newBet]);
  }, []);

  useWebSocketListener("proposal:received", handleProposalReceived);
  useWebSocketListener("proposal:accepted", handleProposalAccepted);
  useWebSocketListener("proposal:rejected", handleProposalRejected);
  useWebSocketListener("bet_proposal_update", handleBetProposalUpdate);
  useWebSocketListener("pago_proposed", handlePagoProposed);

  // Cargar mis apuestas
  useEffect(() => {
    fetchMyBets();
  }, [fetchMyBets]);

  // Update Stats
  useEffect(() => {
    if (bets.length > 0) {
      const stats = bets.reduce(
        (acc, bet) => {
          acc.totalBets++;
          if (bet.status === "active") acc.activeBets++;
          if (bet.result === "win") {
            acc.wonBets++;
            acc.totalWon += (bet as any).potentialWin || 0;
          }
          if (bet.result === "loss") {
            acc.lostBets++;
            acc.totalLost += bet.amount;
          }
          return acc;
        },
        {
          totalBets: 0,
          activeBets: 0,
          wonBets: 0,
          lostBets: 0,
          totalWon: 0,
          totalLost: 0,
          winRate: 0,
          netProfit: 0,
        },
      );

      stats.winRate =
        stats.totalBets > 0 ? (stats.wonBets / stats.totalBets) * 100 : 0;
      stats.netProfit = stats.totalWon - stats.totalLost;
      setBetStats(stats);
    }
  }, [bets]);

  const handleCancelBet = async (betId: string) => {
    try {
      await cancelBet(betId);
    } catch (error) {
      console.error("Error al cancelar apuesta:", error);
    }
  };

  const handleAcceptBet = async (betId: string) => {
    try {
      await acceptBet(betId);
    } catch (error) {
      console.error("Error al aceptar apuesta:", error);
    }
  };

  if (loading) return <LoadingSpinner text="Cargando panel de apuestas..." />;

  // Filter Active vs History
  const activeBetsList = bets.filter(
    (bet) => bet.status === "active" || bet.status === "pending",
  );
  const historyBetsList = bets.filter(
    (bet) =>
      bet.status === "won" ||
      bet.status === "lost" ||
      bet.status === "cancelled",
  );

  return (
    <div className="page-background pb-24">
      <div className="p-4 space-y-6">
        {/* HEADER: ESTADÍSTICAS COMPACTAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card-background p-3 flex items-center justify-between border-l-4 border-blue-500">
            <div>
              <p className="text-xs text-theme-light uppercase font-bold tracking-wider">
                Activas
              </p>
              <p className="text-xl font-bold text-white">
                {betStats.activeBets}
              </p>
            </div>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="card-background p-3 flex items-center justify-between border-l-4 border-green-500">
            <div>
              <p className="text-xs text-theme-light uppercase font-bold tracking-wider">
                Ganadas
              </p>
              <p className="text-xl font-bold text-white">{betStats.wonBets}</p>
            </div>
            <Award className="w-5 h-5 text-green-500" />
          </div>
          <div className="card-background p-3 flex items-center justify-between border-l-4 border-purple-500">
            <div>
              <p className="text-xs text-theme-light uppercase font-bold tracking-wider">
                % Victoria
              </p>
              <p className="text-xl font-bold text-white">
                {betStats.winRate.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div
            className={`card-background p-3 flex items-center justify-between border-l-4 ${betStats.netProfit >= 0 ? "border-emerald-500" : "border-red-500"}`}
          >
            <div>
              <p className="text-xs text-theme-light uppercase font-bold tracking-wider">
                Ganancia
              </p>
              <p
                className={`text-xl font-bold ${betStats.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                ${betStats.netProfit.toFixed(2)}
              </p>
            </div>
            <DollarSign
              className={`w-5 h-5 ${betStats.netProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}
            />
          </div>
        </div>

        {/* Notificaciones Importantes */}
        <ProposalNotifications />

        {/* MAIN GRID: 2 COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUMNA IZQUIERDA: MIS APUESTAS ACTIVAS */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-theme-primary flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Apuestas Activas
            </h2>

            {activeBetsList.length > 0 ? (
              <div className="space-y-3">
                {activeBetsList.map((bet) => (
                  <BetCard
                    key={bet.id}
                    bet={
                      {
                        ...bet,
                        potentialWin: (bet as any).potentialWin || 0,
                        userId: (bet as any).userId || "",
                        updatedAt:
                          (bet as any).updatedAt || new Date().toISOString(),
                        status: bet.status as any,
                        result: bet.result as any,
                      } as any
                    }
                    onCancel={handleCancelBet}
                    onAccept={handleAcceptBet}
                  />
                ))}
              </div>
            ) : (
              <div className="card-background p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-[#596c95]/30">
                <Activity className="w-10 h-10 text-theme-light/50 mb-3" />
                <p className="text-theme-light">
                  No tienes apuestas activas en este momento.
                </p>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: APUESTAS DISPONIBLES (PANEL) */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-theme-primary flex items-center gap-2">
              <Trophy className="w-5 h-5 text-blue-400" />
              Panel de Apuestas
            </h2>

            {loadingLive ? (
              <div className="card-background p-8 flex justify-center">
                <LoadingSpinner text="Buscando eventos en vivo..." />
              </div>
            ) : liveEvent && currentFight ? (
              <div className="card-background border border-blue-500/30 overflow-hidden relative">
                {/* Header del Evento en el Panel */}
                <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-4 border-b border-blue-500/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full animate-pulse">
                          EN VIVO
                        </span>
                        <h3 className="font-bold text-white text-sm">
                          {liveEvent.name}
                        </h3>
                      </div>
                      <p className="text-blue-200 text-xs flex items-center gap-1">
                        Pelea #{currentFight.number} • {currentFight.redCorner}{" "}
                        vs {currentFight.blueCorner}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/live-event/${liveEvent.id}`)}
                      className="text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-2 py-1 rounded transition-colors"
                    >
                      Ver Transmisión
                    </button>
                  </div>
                </div>

                {/* Betting Panel Integrado */}
                <div className="p-0">
                  <BettingPanel
                    fightId={currentFight.id}
                    mode="advanced"
                    onBetPlaced={() => fetchMyBets()}
                  />
                </div>
              </div>
            ) : (
              <div className="card-background p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-10 h-10 text-theme-light/50 mb-3" />
                <h3 className="text-theme-primary font-medium mb-1">
                  Sin Eventos en Vivo
                </h3>
                <p className="text-theme-light text-sm">
                  No hay peleas disponibles para apostar en este momento.
                </p>
                <button
                  onClick={() => navigate("/events")}
                  className="mt-4 text-blue-400 text-sm hover:underline"
                >
                  Ver próximos eventos
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: HISTORIAL */}
        <div className="pt-4 border-t border-[#596c95]/20">
          <h2 className="text-lg font-bold text-theme-primary flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-gray-400" />
            Historial Reciente
          </h2>

          {historyBetsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyBetsList.slice(0, 6).map((bet) => (
                <BetCard
                  key={bet.id}
                  bet={
                    {
                      ...bet,
                      potentialWin: (bet as any).potentialWin || 0,
                      userId: (bet as any).userId || "",
                      updatedAt:
                        (bet as any).updatedAt || new Date().toISOString(),
                      status: bet.status as any,
                      result: bet.result as any,
                    } as any
                  }
                  onCancel={handleCancelBet}
                  onAccept={handleAcceptBet}
                  mode="history"
                />
              ))}
            </div>
          ) : (
            <p className="text-theme-light text-sm italic">
              No hay historial de apuestas finalizadas.
            </p>
          )}

          {historyBetsList.length > 6 && (
            <div className="mt-4 text-center">
              <button className="text-blue-400 text-sm hover:underline">
                Ver todo el historial
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FAB para crear apuesta (solo si hay pelea activa) */}
      {currentFight && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 bg-[#cd6263] text-white p-4 rounded-full shadow-lg hover:bg-[#b55456] transition-colors z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Modal para crear apuesta */}
      {showCreateModal && currentFight && (
        <CreateBetModal
          fightId={currentFight.id}
          onClose={() => {
            fetchMyBets();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

// frontend/src/pages/user/Bets.tsx - Refactored for modern UI and 2-column layout
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Eye,
} from "lucide-react";

import { useBets, useWallet } from "../../hooks/useApi";
import { eventsAPI } from "../../services/api"; // Added for live events
import BetCard from "../../components/user/BetCard";
import CreateBetModal from "../../components/user/CreateBetModal";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { SSEEventType, useSSE } from "../../hooks/useSSE"; // Import useSSE

import type { Bet, EventData, Fight } from "../../types";
import { toast } from "sonner";

export default function UserBets() {
  const navigate = useNavigate();

  // Estados principales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFightForBet, setSelectedFightForBet] = useState<Fight | null>(
    null,
  );

  // API Hooks
  const { bets, loading, fetchMyBets, cancelBet, acceptBet } = useBets();
  const { fetchEvents } = useEvents(); // To fetch event details for pending bets
  const [allEvents, setAllEvents] = useState<EventData[]>([]);

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

  // SSE for bet updates (e.g., bet_matched)
  const apiBaseUrl =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:3001";
  const { status: sseStatus, subscribeToEvents } = useSSE(
    `${apiBaseUrl}/api/sse/public/bets`,
  ); // Public bets channel for user updates

  useEffect(() => {
    if (sseStatus !== "connected") return;

    const unsubscribe = subscribeToEvents({
      BET_MATCHED: (data) => {
        const betData = data.data as Bet;
        if (betData?.userId === betsRef.current[0]?.userId) { // Check if it's current user's bet
          toast.success(`¡Tu apuesta de $${betData.amount} ha sido igualada!`);
          fetchMyBets(); // Refresh my bets
        }
      },
      NEW_BET: () => {
        // A new bet was created, might be relevant for available bets
        // Refetch all events to update available bets
        fetchMyBets();
      },
    });

    return () => {
      unsubscribe();
    };
  }, [sseStatus, subscribeToEvents, fetchMyBets]);

  // Use ref for bets for SSE handler to access latest state
  const betsRef = useRef<Bet[]>([]);
  useEffect(() => {
    betsRef.current = bets.map((bet) => ({
      ...bet,
      potentialWin: bet.potentialWin ?? 0,
      updatedAt: bet.updatedAt ?? new Date().toISOString(),
      result: bet.result ?? undefined,
      createdAt: bet.createdAt ?? new Date().toISOString(),
    }));
  }, [bets]);

  // Fetch all events for contextual info
  useEffect(() => {
    const loadAllEvents = async () => {
      try {
        const response = await eventsAPI.getAll({ limit: 100, includeFights: true });
        if (response.success && response.data?.events) {
          setAllEvents(response.data.events);
        }
      } catch (error) {
        console.error("Error loading all events:", error);
      }
    };
    loadAllEvents();
  }, []);

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
          if (bet.status === "active" || bet.status === "pending") acc.activeBets++; // Treat pending as active for stats
          if (bet.result === "win") {
            acc.wonBets++;
            acc.totalWon += bet.payout ?? 0; // Use payout for won bets
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
      fetchMyBets(); // Refresh after cancel
    } catch (error) {
      console.error("Error al cancelar apuesta:", error);
    }
  };

  const handleAcceptBet = async (betId: string) => {
    try {
      await acceptBet(betId);
      fetchMyBets(); // Refresh after accept
    } catch (error) {
      console.error("Error al aceptar apuesta:", error);
    }
  };

  // Filter Active vs History (MUST be before conditional return)
  const myActiveBets = useMemo(
    () =>
      bets.filter(
        (bet) =>
          bet.status === "active" ||
          bet.status === "pending" ||
          bet.status === "matched", // Matched bets are still active for user
      ),
    [bets],
  );

  const historyBetsList = useMemo(
    () =>
      bets.filter(
        (bet) =>
          bet.status === "won" ||
          bet.status === "lost" ||
          bet.status === "cancelled",
      ),
    [bets],
  );

  // Filter pending bets that are offers (available for matching)
  const availableBetsForMatching = useMemo(() => {
    const allBetsFromEvents: (Bet & { eventName: string; fightNumber: number })[] = [];

    allEvents.forEach(event => {
      event.fights?.forEach(fight => {
        fight.bets?.forEach(bet => { // Assuming 'bets' property exists on Fight
          if (bet.status === "pending" && bet.isOffer && bet.userId !== betsRef.current[0]?.userId) {
            allBetsFromEvents.push({ ...bet, eventName: event.name, fightNumber: fight.number, eventId: event.id });
          }
        });
      });
    });
    return allBetsFromEvents;
  }, [allEvents, betsRef.current]);

  if (loading) return <LoadingSpinner text="Cargando panel de apuestas..." />;

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

        {/* MAIN GRID: 2 COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUMNA IZQUIERDA: MIS APUESTAS ACTIVAS */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-theme-primary flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Mis Apuestas Activas
            </h2>

            {myActiveBets.length > 0 ? (
              <div className="space-y-3">
                {myActiveBets.map((bet) => (
                  <BetCard
                    key={bet.id}
                    bet={bet as Bet}
                    onCancel={handleCancelBet}
                    onAccept={() => navigate(`/live-event/${bet.eventId}`)} // Navigate to event to manage/accept
                  />
                ))}
              </div>
            ) : (
              <div className="card-background p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-[#596c95]/30">
                <Activity className="w-10 h-10 text-theme-light/50 mb-3" />
                <p className="text-theme-light">
                  No tienes apuestas activas en este momento.
                </p>
                <button
                  onClick={() => navigate("/events")}
                  className="mt-4 text-blue-400 text-sm hover:underline"
                >
                  Ver eventos para apostar
                </button>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: APUESTAS DISPONIBLES */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-theme-primary flex items-center gap-2">
              <Trophy className="w-5 h-5 text-blue-400" />
              Apuestas Disponibles para Match
            </h2>

            {availableBetsForMatching.length === 0 ? (
              <div className="card-background p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-10 h-10 text-theme-light/50 mb-3" />
                <h3 className="text-theme-primary font-medium mb-1">
                  Sin Apuestas Disponibles
                </h3>
                <p className="text-theme-light text-sm">
                  No hay apuestas de otros usuarios que puedas igualar en este
                  momento.
                </p>
                <button
                  onClick={() => navigate("/events")}
                  className="mt-4 text-blue-400 text-sm hover:underline"
                >
                  Crea tus propias apuestas
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {availableBetsForMatching.map((bet) => (
                  <div
                    key={bet.id}
                    className="card-background p-4 rounded-lg border border-[#596c95]/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-white">
                        {bet.eventName} - Pelea #{bet.fightNumber}
                      </p>
                      {/* <StatusChip status={bet.status} size="sm" /> */}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <p className="text-theme-light">
                          Apostado:{" "}
                          <span className="font-medium text-white">
                            ${bet.amount}
                          </span>
                        </p>
                        <p className="text-theme-light">
                          Lado:{" "}
                          <span className="font-medium text-white">
                            {bet.side === "red" ? "Rojo" : "Azul"}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => handleAcceptBet(bet.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Igualar
                        </button>
                        <button
                          onClick={() => navigate(`/live-event/${bet.eventId}`)}
                          className="text-blue-400 text-xs hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Ver Evento
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
                  bet={bet as Bet}
                  onCancel={handleCancelBet}
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
      {selectedFightForBet && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 bg-[#cd6263] text-white p-4 rounded-full shadow-lg hover:bg-[#b55456] transition-colors z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Modal para crear apuesta */}
      {showCreateModal && selectedFightForBet && (
        <CreateBetModal
          fightId={selectedFightForBet.id}
          onClose={() => {
            fetchMyBets();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}
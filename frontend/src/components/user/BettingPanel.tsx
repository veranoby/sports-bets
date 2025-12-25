//CONSOLIDAR BettingPanel.tsx
// Archivo: frontend/src/components/user/BettingPanel.tsx (REEMPLAZAR COMPLETO)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useBets } from "../../hooks/useApi";
import { useFightSSE, SSEEventType } from "../../hooks/useSSE"; // Use fight-specific SSE hook
import { useWebSocketContext } from "../../contexts/WebSocketContext"; // Keep WebSocket minimal for PAGO/DOY proposals only
import { Plus, Zap, DollarSign, Users } from "lucide-react";
import CreateBetModal from "./CreateBetModal";
import { useFeatureFlags } from "../../hooks/useFeatureFlags"; // Added import

interface BettingPanelProps {
  fightId: string;
  mode?: "quick" | "advanced" | "embedded";
  onBetPlaced?: () => void;
}

const BettingPanel: React.FC<BettingPanelProps> = ({
  fightId,
  mode = "quick",
  onBetPlaced,
}) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { bets, fetchAvailableBets } = useBets();

  // Use SSE for general events like new bets and betting window changes
  const { bettingWindow, subscribe, status: sseStatus } = useFightSSE(fightId);
  const { addListener, emit } = useWebSocketContext(); // Keep WebSocket minimal for PAGO/DOY only
  const { isBettingEnabled } = useFeatureFlags(); // Added feature flag check

  // Referencia estable para fetchAvailableBets - TODOS los hooks deben ir antes del return condicional
  const fetchAvailableBetsRef = useRef(fetchAvailableBets);
  useEffect(() => {
    fetchAvailableBetsRef.current = fetchAvailableBets;
  }, [fetchAvailableBets]);

  // Handlers memoizados
  const handleNewBet = useCallback(() => {
    fetchAvailableBetsRef.current(fightId);
  }, [fightId, fetchAvailableBetsRef]);

  const handleBetMatched = useCallback(() => {
    onBetPlaced?.();
  }, [onBetPlaced]);

  const handleBettingWindowClosed = useCallback(() => {
    fetchAvailableBetsRef.current(fightId);
  }, [fightId]);

  // Subscribe to SSE events for fight/betting updates (minimize WebSocket usage to PAGO/DOY only)
  useEffect(() => {
    if (sseStatus !== "connected") return;

    const unsubscribers = [
      subscribe(SSEEventType.NEW_BET, (event) => {
        if (event.metadata?.fightId === fightId) {
          handleNewBet();
        }
      }),
    ];

    let cleanupBetMatched = () => {};
    if (onBetPlaced) {
      cleanupBetMatched = subscribe(SSEEventType.BET_MATCHED, (event) => {
        if (event.metadata?.fightId === fightId) {
          onBetPlaced();
        }
      });
    }

    return () => {
      unsubscribers.forEach((unsubs) => unsubs());
      cleanupBetMatched();
    };
  }, [sseStatus, subscribe, fightId, handleNewBet, onBetPlaced]);

  // Keep minimal WebSocket for PAGO/DOY proposals only (bidirectional)
  useEffect(() => {
    // Only subscribe to proposal events via WebSocket (bidirectional required)
    // New bets and matches handled by SSE (one-way updates)

    const cleanupPagoProposal = addListener("pago_proposal", () => {
      console.log("PAGO proposal received, showing notification");
      // Handle PAGO proposal
    });

    const cleanupDoyProposal = addListener("doy_proposal", () => {
      console.log("DOY proposal received, showing notification");
      // Handle DOY proposal
    });

    return () => {
      cleanupPagoProposal();
      cleanupDoyProposal();
    };
  }, [addListener]);

  // Return condicional DESPUÉS de todos los hooks
  if (!isBettingEnabled) return null;

  const renderQuickMode = () => (
    <div className="space-y-4">
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full bg-gradient-to-r from-[#cd6263] to-[#cd6263]/90 hover:from-[#cd6263]/90 hover:to-[#cd6263] text-white p-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
      >
        <Plus size={24} className="text-white" />
        <span className="font-semibold text-lg">Crear Apuesta</span>
      </button>

      <div className="flex items-center justify-center">
        <button
          onClick={() => setCurrentMode("advanced")}
          className="text-[#596c95] hover:text-[#cd6263] text-sm flex items-center gap-2 transition-colors font-medium"
        >
          <Zap size={18} />
          Ver opciones avanzadas
        </button>
      </div>
    </div>
  );

  const renderAdvancedMode = () => (
    <div className="space-y-5">
      <div className="flex justify-between items-center pb-3 border-b border-[#596c95]/30">
        <h3 className="text-white font-bold flex items-center gap-3 text-lg">
          <Users className="w-6 h-6 text-blue-600" />
          Apuestas disponibles
        </h3>
        <button
          onClick={() => setCurrentMode("quick")}
          className="text-[#596c95] hover:text-[#cd6263] text-sm flex items-center gap-2 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-[#2a325c]"
        >
          <Zap size={18} />
          <span>Modo rápido</span>
        </button>
      </div>

      <div className="space-y-3">
        {bets.length > 0 ? (
          bets.map((bet) => (
            <div
              key={bet.id}
              className="bg-[#2a325c] border border-[#596c95] p-4 rounded-xl hover:bg-[#2a325c]/80 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${bet.side === "red" ? "bg-red-500/20" : "bg-blue-500/20"}`}
                  >
                    <DollarSign
                      className={`w-5 h-5 ${bet.side === "red" ? "text-red-400" : "text-blue-600"}`}
                    />
                  </div>
                  <div>
                    <span className="text-white font-bold text-lg">
                      ${bet.amount}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm ${bet.side === "red" ? "text-red-400" : "text-blue-600"} font-medium`}
                      >
                        {bet.side === "red" ? "🔴 Rojo" : "🔵 Azul"}
                      </span>
                      {bet.status === "active" && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-green-500/20 text-green-600 rounded-full">
                          ACTIVA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="bg-gradient-to-r from-[#cd6263] to-[#cd6263]/90 hover:from-[#cd6263]/90 hover:to-[#cd6263] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  onClick={() => {
                    // Use the WebSocket context to accept the bet
                    emit("accept_pago_bet", { betId: bet.id });

                    // Update UI state after successful acceptance
                    onBetPlaced?.();
                  }}
                >
                  Aceptar
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-[#2a325c]/50 rounded-xl border border-dashed border-[#596c95]">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
            <h4 className="text-lg font-medium text-gray-300 mb-1">
              No hay apuestas disponibles
            </h4>
            <p className="text-sm text-gray-500">
              Las apuestas aparecerán aquí cuando otros usuarios las creen
            </p>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full bg-gradient-to-r from-[#cd6263] to-[#cd6263]/90 hover:from-[#cd6263]/90 hover:to-[#cd6263] text-white p-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
      >
        <Plus size={24} className="text-white" />
        <span className="font-semibold text-lg">Nueva Apuesta</span>
      </button>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-[#1a1f37] to-[#2a325c] border border-[#596c95]/50 p-5 rounded-2xl shadow-xl">
      {currentMode === "quick" ? renderQuickMode() : renderAdvancedMode()}

      {showCreateModal && (
        <CreateBetModal
          fightId={fightId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

//"TERMINANDO REFACTORING  del sistema por nueva logica de apuestas - ACTUALIZACION 1"

export default BettingPanel;

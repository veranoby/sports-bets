//CONSOLIDAR BettingPanel.tsx
// Archivo: frontend/src/components/user/BettingPanel.tsx (REEMPLAZAR COMPLETO)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useBets } from "../../hooks/useApi";
import { useWebSocketRoom } from "../../hooks/useWebSocket";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
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
  const { isConnected } = useWebSocketRoom(fightId);
  const { addListener } = useWebSocketContext();
  const { isBettingEnabled } = useFeatureFlags(); // Added feature flag check

  // Referencia estable para fetchAvailableBets - TODOS los hooks deben ir antes del return condicional
  const fetchAvailableBetsRef = useRef(fetchAvailableBets);
  useEffect(() => {
    fetchAvailableBetsRef.current = fetchAvailableBets;
  }, [fetchAvailableBets]);

  // Handlers memoizados
  const handleNewBet = useCallback(() => {
    fetchAvailableBetsRef.current(fightId);
  }, [fightId]);

  const handleBetMatched = useCallback(() => {
    onBetPlaced?.();
  }, [onBetPlaced]);

  const handleBettingWindowClosed = useCallback(() => {
    fetchAvailableBetsRef.current(fightId);
  }, [fightId]);

  // Listeners (solo depende de isConnected)
  useEffect(() => {
    if (!isConnected) return;

    const cleanupNewBet = addListener("new_bet", handleNewBet);
    const cleanupWindowClosed = addListener(
      "betting_window_closed",
      handleBettingWindowClosed,
    );
    let cleanupBetMatched = () => {};
    if (onBetPlaced) {
      cleanupBetMatched = addListener("bet_matched", handleBetMatched);
    }

    return () => {
      cleanupNewBet();
      cleanupWindowClosed();
      cleanupBetMatched();
    };
  }, [
    isConnected,
    addListener,
    handleNewBet,
    handleBettingWindowClosed,
    handleBetMatched,
    onBetPlaced,
  ]);

  // Return condicional DESPUÉS de todos los hooks
  if (!isBettingEnabled) return null;

  const renderQuickMode = () => (
    <div className="space-y-4">
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full bg-[#cd6263] hover:bg-[#cd6263]/90 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
      >
        <Plus size={20} />
        <span className="font-medium">Crear Apuesta</span>
      </button>
      
      <div className="flex items-center justify-center">
        <button
          onClick={() => setCurrentMode("advanced")}
          className="text-[#596c95] hover:text-[#cd6263] text-sm flex items-center gap-1 transition-colors"
        >
          <Zap size={16} />
          Ver opciones avanzadas
        </button>
      </div>
    </div>
  );

  const renderAdvancedMode = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Apuestas disponibles
        </h3>
        <button
          onClick={() => setCurrentMode("quick")}
          className="text-[#596c95] hover:text-[#cd6263] text-sm flex items-center gap-1 transition-colors"
        >
          <Zap size={16} />
          Modo rápido
        </button>
      </div>

      <div className="space-y-3">
        {bets.length > 0 ? (
          bets.map((bet) => (
            <div 
              key={bet.id} 
              className="bg-[#2a325c] border border-[#596c95] p-3 rounded-lg hover:bg-[#2a325c]/80 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-white font-medium">
                    ${bet.amount} - {bet.side === "red" ? "🔴 Rojo" : "🔵 Azul"}
                  </span>
                </div>
                <button 
                  className="bg-[#cd6263] hover:bg-[#cd6263]/90 text-white px-3 py-1 rounded text-sm transition-colors"
                  onClick={() => {
                    // Aquí iría la lógica para aceptar la apuesta
                    console.log("Aceptar apuesta:", bet.id);
                  }}
                >
                  Aceptar
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <Users className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-400">
              No hay apuestas disponibles
            </p>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full bg-[#cd6263] hover:bg-[#cd6263]/90 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
      >
        <Plus size={20} />
        <span className="font-medium">Nueva Apuesta</span>
      </button>
    </div>
  );

  return (
    <div className="bg-[#1a1f37] border border-[#596c95] p-4 rounded-xl shadow-lg">
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

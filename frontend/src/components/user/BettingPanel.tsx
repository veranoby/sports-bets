//CONSOLIDAR BettingPanel.tsx
// Archivo: frontend/src/components/user/BettingPanel.tsx (REEMPLAZAR COMPLETO)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useBets, useWallet } from "../../hooks/useApi";
import { useWebSocketRoom } from "../../hooks/useWebSocket";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import { Plus, Zap, ChevronDown, ChevronUp } from "lucide-react";
import CreateBetModal from "./CreateBetModal";

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
  const { wallet } = useWallet();
  const { isConnected } = useWebSocketRoom(fightId);
  const { addListener, removeListener } = useWebSocketContext();

  // Referencia estable para fetchAvailableBets
  const fetchAvailableBetsRef = useRef(fetchAvailableBets);
  useEffect(() => {
    fetchAvailableBetsRef.current = fetchAvailableBets;
  }, [fetchAvailableBets]);

  // Handlers memoizados
  const handleNewBet = useCallback(() => {
    fetchAvailableBetsRef.current();
  }, []);

  const handleBetMatched = useCallback(() => {
    onBetPlaced?.();
  }, []);

  const handleBettingWindowClosed = useCallback(() => {
    fetchAvailableBetsRef.current();
  }, []);

  // Listeners (solo depende de isConnected)
  useEffect(() => {
    if (!isConnected) return;

    addListener("new_bet", handleNewBet);
    addListener("betting_window_closed", handleBettingWindowClosed);
    if (onBetPlaced) {
      addListener("bet_matched", handleBetMatched);
    }

    return () => {
      removeListener("new_bet", handleNewBet);
      removeListener("betting_window_closed", handleBettingWindowClosed);
      if (onBetPlaced) {
        removeListener("bet_matched", handleBetMatched);
      }
    };
  }, [isConnected]);

  const renderQuickMode = () => (
    <div className="space-y-3">
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full bg-[#cd6263] text-white p-3 rounded-lg flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Crear Apuesta
      </button>
      <button
        onClick={() => setCurrentMode("advanced")}
        className="text-[#596c95] text-sm w-full text-center"
      >
        Ver opciones avanzadas
      </button>
    </div>
  );

  const renderAdvancedMode = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-medium">Apuestas disponibles</h3>
        <button
          onClick={() => setCurrentMode("quick")}
          className="text-[#596c95] text-sm flex items-center gap-1"
        >
          <Zap size={16} />
          Modo rápido
        </button>
      </div>

      <div className="space-y-2">
        {bets.length > 0 ? (
          bets.map((bet) => (
            <div key={bet.id} className="bg-[#596c95] p-3 rounded">
              <div className="flex justify-between items-center">
                <span className="text-white">
                  ${bet.amount} - {bet.side === "red" ? "Rojo" : "Azul"}
                </span>
                <button className="bg-[#cd6263] text-white px-3 py-1 rounded text-sm">
                  Aceptar
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center">
            No hay apuestas disponibles
          </p>
        )}
      </div>

      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full bg-[#cd6263] text-white p-3 rounded-lg flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Nueva Apuesta
      </button>
    </div>
  );

  return (
    <div className="bg-[#2a325c] p-4 rounded-lg">
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

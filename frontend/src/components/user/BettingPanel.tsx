CONSOLIDAR BettingPanel.tsx
// Archivo: frontend/src/components/user/BettingPanel.tsx (REEMPLAZAR COMPLETO)

import React, { useState, useEffect } from 'react';
import { useBets, useWallet } from '../../hooks/useApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import CreateBetModal from './CreateBetModal';
import { Plus, Zap } from 'lucide-react';

interface BettingPanelProps {
  fightId: string;
  mode?: 'quick' | 'advanced';
  onBetPlaced?: () => void;
}

const BettingPanel: React.FC<BettingPanelProps> = ({ 
  fightId, 
  mode = 'quick', 
  onBetPlaced 
}) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { bets, fetchAvailableBets } = useBets();
  const { wallet } = useWallet();

  // WebSocket para actualizaciones en tiempo real
  const wsListeners = {
    new_bet: () => fetchAvailableBets(fightId),
    bet_matched: () => {
      console.log('¡Apuesta emparejada!');
      onBetPlaced?.();
    },
  };

  const { isConnected } = useWebSocket(fightId, wsListeners);

  if (currentMode === 'quick') {
    return (
      <div className="bg-[#2a325c] p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-medium">Apuestas Rápidas</h3>
          <button
            onClick={() => setCurrentMode('advanced')}
            className="text-[#596c95] text-sm"
          >
            Opciones avanzadas
          </button>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-[#cd6263] text-white p-3 rounded-lg flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Crear Apuesta
        </button>

        {showCreateModal && (
          <CreateBetModal
            fightId={fightId}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#2a325c] p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-medium">Panel de Apuestas</h3>
        <button
          onClick={() => setCurrentMode('quick')}
          className="text-[#596c95] text-sm flex items-center gap-1"
        >
          <Zap size={16} />
          Modo rápido
        </button>
      </div>

      {/* Mostrar apuestas disponibles */}
      <div className="space-y-2 mb-4">
        {bets.length > 0 ? (
          bets.map(bet => (
            <div key={bet.id} className="bg-[#596c95] p-3 rounded">
              <div className="flex justify-between items-center">
                <span className="text-white">
                  ${bet.amount} - {bet.side === 'red' ? 'Rojo' : 'Azul'}
                </span>
                <button className="bg-[#cd6263] text-white px-3 py-1 rounded text-sm">
                  Aceptar
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center">No hay apuestas disponibles</p>
        )}
      </div>

      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full bg-[#cd6263] text-white p-3 rounded-lg flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Nueva Apuesta
      </button>

      {showCreateModal && (
        <CreateBetModal
          fightId={fightId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default BettingPanel;

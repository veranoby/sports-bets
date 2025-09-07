import React from 'react';
import { Fight, FightStatus } from '../../types';

interface FightControlProps {
  fight: Fight;
  onStatusChange: (fightId: string, newStatus: FightStatus) => void;
  isLoading: boolean;
}

const FightControl: React.FC<FightControlProps> = ({ fight, onStatusChange, isLoading }) => {
  const canOpenBetting = fight.status === 'upcoming';
  const canCloseBetting = fight.status === 'betting';
  const canStartFight = fight.status === 'betting'; // Same as closing betting
  const canCompleteFight = fight.status === 'live';

  const buttonClasses = "px-4 py-2 rounded text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed";
  const greenButton = `${buttonClasses} bg-green-600 hover:bg-green-700`;
  const redButton = `${buttonClasses} bg-red-600 hover:bg-red-700`;
  const blueButton = `${buttonClasses} bg-blue-600 hover:bg-blue-700`;
  const grayButton = `${buttonClasses} bg-gray-600 hover:bg-gray-700`;

  return (
    <div className="flex items-center gap-2 p-4 bg-gray-100 rounded-lg shadow-inner">
      <h4 className="font-semibold">Controles de Pelea:</h4>
      <div className="flex gap-2">
        {canOpenBetting && (
          <button 
            onClick={() => onStatusChange(fight.id, 'betting')}
            className={greenButton}
            disabled={isLoading}
          >
            {isLoading ? 'Abriendo...' : 'Abrir Apuestas'}
          </button>
        )}
        {canCloseBetting && (
          <button 
            onClick={() => onStatusChange(fight.id, 'live')}
            className={redButton}
            disabled={isLoading}
          >
            {isLoading ? 'Cerrando...' : 'Cerrar Apuestas'}
          </button>
        )}
        {canStartFight && (
            <button
                onClick={() => onStatusChange(fight.id, 'live')}
                className={blueButton}
                disabled={isLoading}
            >
                {isLoading ? 'Iniciando...' : 'Iniciar Pelea'}
            </button>
        )}
        {canCompleteFight && (
          <button 
            onClick={() => onStatusChange(fight.id, 'completed')}
            className={grayButton}
            disabled={isLoading}
          >
            {isLoading ? 'Finalizando...' : 'Finalizar Pelea'}
          </button>
        )}
      </div>
    </div>
  );
};

export default FightControl;

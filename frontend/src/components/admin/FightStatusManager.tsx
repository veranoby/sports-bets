// frontend/src/components/admin/FightStatusManager.tsx
// Fight Status Manager - Uses new PATCH endpoints for fight status transitions

import React, { useState } from 'react';
import {
  Clock,
  DollarSign,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Timer,
  Loader2,
  Trophy
} from 'lucide-react';
import useSSE from '../../hooks/useSSE';

interface Fight {
  id: string;
  eventId: string;
  number: number;
  redCorner: string;
  blueCorner: string;
  weight: number;
  status: "upcoming" | "betting" | "live" | "completed" | "cancelled";
  result?: "red" | "blue" | "draw" | "cancelled";
  bettingStartTime?: string;
  bettingEndTime?: string;
  totalBets: number;
  totalAmount: number;
  notes?: string;
}

interface FightStatusManagerProps {
  fight: Fight;
  onFightUpdated: (updatedFight: Fight) => void;
  disabled?: boolean;
  className?: string;
}

const FightStatusManager: React.FC<FightStatusManagerProps> = ({
  fight,
  onFightUpdated,
  disabled = false,
  className = ""
}) => {
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResultSelector, setShowResultSelector] = useState(false);

  // SSE for real-time fight updates
  const fightSSE = useSSE(`/api/sse/fights/${fight.id}/status`);

  // Handle SSE updates
  React.useEffect(() => {
    if (fightSSE.data && fightSSE.data.fightId === fight.id) {
      const { status, result, ...otherData } = fightSSE.data;
      onFightUpdated({
        ...fight,
        status,
        result,
        ...otherData
      });
    }
  }, [fightSSE.data, fight, onFightUpdated]);

  // Handle fight status actions using new PATCH endpoints
  const handleFightAction = async (newStatus: 'betting' | 'live' | 'completed', result?: 'red' | 'blue' | 'draw') => {
    try {
      setOperationInProgress(newStatus);
      setError(null);

      const body: any = { status: newStatus };
      if (result && newStatus === 'completed') {
        body.result = result;
      }

      // Use new PATCH endpoint
      const response = await fetch(`/api/fights/${fight.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update fight status to ${newStatus}`);
      }

      const responseData = await response.json();

      // Update fight with response data
      if (responseData.success && responseData.data) {
        onFightUpdated({
          ...fight,
          ...responseData.data.fight,
          result: result || responseData.data.result
        });
      }

      setShowResultSelector(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error updating fight status to ${newStatus}`;
      setError(errorMessage);
      console.error(`Error updating fight status:`, err);
    } finally {
      setOperationInProgress(null);
    }
  };

  // Validate transitions
  const canOpenBetting = fight.status === "upcoming";
  const canStartFight = fight.status === "betting";
  const canComplete = fight.status === "live";

  const FightStatusBadge = ({ status }: { status: string }) => {
    const configs = {
      upcoming: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: Clock,
        label: "Próxima"
      },
      betting: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: DollarSign,
        label: "Apuestas Abiertas"
      },
      live: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: Play,
        label: "En Vivo"
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "Completada"
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: XCircle,
        label: "Cancelada"
      }
    };

    const config = configs[status as keyof typeof configs] || configs.upcoming;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
        {status === "live" && <span className="animate-pulse ml-1">🥊</span>}
        {status === "betting" && <span className="ml-1">💰</span>}
      </span>
    );
  };

  const ResultDisplay = ({ result }: { result?: string }) => {
    if (!result) return null;

    const resultConfigs = {
      red: { label: "Ganó Rojo", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
      blue: { label: "Ganó Azul", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
      draw: { label: "Empate", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" }
    };

    const config = resultConfigs[result as keyof typeof resultConfigs];
    if (!config) return null;

    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg} ${config.border} border`}>
        <Trophy className={`w-4 h-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">
            Pelea #{fight.number}: {fight.redCorner} vs {fight.blueCorner}
          </h4>
          <p className="text-sm text-gray-600">
            Peso: {fight.weight}kg • {fight.totalBets} apuestas • ${fight.totalAmount.toLocaleString()}
          </p>
        </div>
        <FightStatusBadge status={fight.status} />
      </div>

      {/* Fight Transition Timeline */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Próxima</span>
          <span>Apuestas</span>
          <span>En Vivo</span>
          <span>Completada</span>
        </div>
        <div className="flex items-center">
          {/* Upcoming to Betting */}
          <div className={`flex-1 h-2 rounded-l ${
            fight.status === "upcoming" ? "bg-gray-300" : "bg-yellow-500"
          }`}></div>
          <div className={`w-3 h-3 rounded-full border-2 ${
            fight.status === "upcoming" ? "bg-gray-300 border-gray-400" :
            fight.status === "betting" ? "bg-yellow-500 border-yellow-600" :
            "bg-yellow-500 border-yellow-600"
          }`}></div>

          {/* Betting to Live */}
          <div className={`flex-1 h-2 ${
            fight.status === "live" || fight.status === "completed" ? "bg-red-500" :
            fight.status === "betting" ? "bg-yellow-500" : "bg-gray-300"
          }`}></div>
          <div className={`w-3 h-3 rounded-full border-2 ${
            fight.status === "live" ? "bg-red-500 border-red-600" :
            fight.status === "completed" ? "bg-green-500 border-green-600" :
            "bg-gray-300 border-gray-400"
          }`}></div>

          {/* Live to Completed */}
          <div className={`flex-1 h-2 rounded-r ${
            fight.status === "completed" ? "bg-green-500" : "bg-gray-300"
          }`}></div>
          <div className={`w-3 h-3 rounded-full border-2 ${
            fight.status === "completed" ? "bg-green-500 border-green-600" :
            "bg-gray-300 border-gray-400"
          }`}></div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Result Display */}
      {fight.status === "completed" && fight.result && (
        <div className="mb-4">
          <ResultDisplay result={fight.result} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Open Betting Button */}
        {canOpenBetting && (
          <button
            onClick={() => handleFightAction('betting')}
            disabled={disabled || operationInProgress === 'betting'}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {operationInProgress === 'betting' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <DollarSign className="w-4 h-4" />
            )}
            {operationInProgress === 'betting' ? 'Abriendo...' : 'Abrir Apuestas'}
          </button>
        )}

        {/* Start Fight Button */}
        {canStartFight && (
          <button
            onClick={() => handleFightAction('live')}
            disabled={disabled || operationInProgress === 'live'}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {operationInProgress === 'live' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {operationInProgress === 'live' ? 'Iniciando...' : 'Iniciar Pelea'}
          </button>
        )}

        {/* Complete Fight Button */}
        {canComplete && !showResultSelector && (
          <button
            onClick={() => setShowResultSelector(true)}
            disabled={disabled || operationInProgress === 'completed'}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trophy className="w-4 h-4" />
            Registrar Resultado
          </button>
        )}
      </div>

      {/* Result Selector */}
      {showResultSelector && canComplete && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 className="text-sm font-medium text-gray-900 mb-3">Seleccionar Resultado</h5>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleFightAction('completed', 'red')}
              disabled={operationInProgress === 'completed'}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {operationInProgress === 'completed' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trophy className="w-4 h-4" />
              )}
              Ganó Rojo
            </button>
            <button
              onClick={() => handleFightAction('completed', 'blue')}
              disabled={operationInProgress === 'completed'}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {operationInProgress === 'completed' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trophy className="w-4 h-4" />
              )}
              Ganó Azul
            </button>
            <button
              onClick={() => handleFightAction('completed', 'draw')}
              disabled={operationInProgress === 'completed'}
              className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              {operationInProgress === 'completed' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              Empate
            </button>
            <button
              onClick={() => setShowResultSelector(false)}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Timing Information */}
      {(fight.bettingStartTime || fight.bettingEndTime) && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
          {fight.bettingStartTime && (
            <div className="flex items-center gap-2">
              <Timer className="w-3 h-3" />
              <span>Apuestas iniciadas: {new Date(fight.bettingStartTime).toLocaleTimeString()}</span>
            </div>
          )}
          {fight.bettingEndTime && (
            <div className="flex items-center gap-2">
              <Timer className="w-3 h-3" />
              <span>Apuestas cerradas: {new Date(fight.bettingEndTime).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {fight.notes && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Notas:</strong> {fight.notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default FightStatusManager;
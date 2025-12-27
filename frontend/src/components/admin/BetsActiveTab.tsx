import React, { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import { betsAPI } from "../../services/api";
import type { Bet, EventData } from "../../types";

interface BetsActiveTabProps {
  eventId: string;
  eventDetailData: EventData;
  fightId?: string | null; // Optional fight ID to filter bets
  selectedFightId?: string | null;
  onStartBettingSession?: (fightId: string) => void;
  onCloseBettingSession?: (fightId: string) => void;
  operationInProgress?: string | null;
}

const BetsActiveTab: React.FC<BetsActiveTabProps> = ({
  eventId,
  eventDetailData,
  fightId,
  selectedFightId,
  onStartBettingSession,
  onCloseBettingSession,
  operationInProgress,
}) => {
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load active bets for the event
  useEffect(() => {
    const fetchActiveBets = async () => {
      if (!eventId) return;

      try {
        setLoading(true);
        setError(null);

        const params: { eventId: string; limit: number; fightId?: string } = {
          eventId,
          limit: 100, // Limit to 100 bets for performance during live event
        };

        // Add fightId filter if provided
        if (fightId) {
          params.fightId = fightId;
        }

        const response = await betsAPI.getAllAdmin(params);

        if (response.success && response.data) {
          // Filter for active and pending bets only
          const filteredBets = (response.data.bets || []).filter(
            (bet: Bet) => bet.status === "active" || bet.status === "pending",
          );
          setActiveBets(filteredBets);
        } else {
          setError(response.error || "Error loading active bets");
        }
      } catch (err) {
        // Si hay error de apuestas, mostrar mensaje informativo
        if (
          err instanceof Error &&
          err.message.includes("fight->event.title")
        ) {
          setError(
            "No se pudieron cargar las apuestas activas debido a un error en el servidor. Esta funcionalidad puede estar temporalmente no disponible.",
          );
        } else {
          setError(
            err instanceof Error ? err.message : "Error loading active bets",
          );
        }
        console.error("Error fetching active bets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveBets();
  }, [eventId, fightId]);

  // Calculate statistics
  const totalActiveAmount = activeBets.reduce(
    (sum, bet) => sum + (bet.amount || 0),
    0,
  );
  const totalActiveBets = activeBets.length;
  const uniqueUsers = new Set(activeBets.map((bet) => bet.userId)).size;

  if (loading) {
    return <LoadingSpinner text="Cargando apuestas activas..." />;
  }

  return (
    <div className="space-y-6">
      {/* cabecera y estadisticas rapidas */}

      <div className="flex items-center justify-between m-4">
        <h4 className="text-lg font-medium text-gray-900">
          Apuestas Activas ({totalActiveBets})
        </h4>
        <div className="text-sm text-gray-600">Actualizado en tiempo real</div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <button
            onClick={() =>
              onStartBettingSession &&
              selectedFightId &&
              onStartBettingSession(selectedFightId)
            }
            disabled={operationInProgress !== null || !selectedFightId}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
          >
            INICIAR sesion de Apuestas!
          </button>
          <button
            onClick={() =>
              onCloseBettingSession &&
              selectedFightId &&
              onCloseBettingSession(selectedFightId)
            }
            disabled={operationInProgress !== null || !selectedFightId}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
          >
            CERRAR sesion de Apuestas!
          </button>

          <button className="px-4 py-2 bg-gray-400 text-white rounded-xl flex items-center gap-1">
            Apuestas Activas {totalActiveBets}
          </button>

          <button className="px-4 py-2 bg-gray-400 text-white rounded-xl flex items-center gap-1">
            Volumen Total ${totalActiveAmount.toLocaleString()}
          </button>
        </div>
      </div>

      <div>
        {error ? (
          <Card className="p-6">
            <div className="text-center text-red-600">
              <p>Error: {error}</p>
            </div>
          </Card>
        ) : totalActiveBets === 0 ? (
          <Card className="p-6">
            <EmptyState
              title="No hay apuestas activas"
              description="Las apuestas activas para este evento aparecerán aquí cuando los usuarios comiencen a apostar."
              icon={<BarChart3 className="w-12 h-12" />}
            />
          </Card>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiempo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeBets.map((bet) => (
                    <tr key={bet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bet.id?.substring(0, 8) || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bet.userId?.substring(0, 8) || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${bet.amount?.toLocaleString() || "0"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bet.selectedSide || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            bet.status === "active" || bet.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : bet.status === "won"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {bet.status?.charAt(0).toUpperCase() +
                            bet.status?.slice(1) || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bet.createdAt
                          ? new Date(bet.createdAt).toLocaleTimeString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetsActiveTab;

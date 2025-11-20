import React, { useState, useEffect } from "react";
import { DollarSign, BarChart3, Activity } from "lucide-react";
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import { betsAPI } from "../../services/api";
import type { Bet } from "../../types";

interface BetsActiveTabProps {
  eventId: string;
  eventDetailData: any;
}

const BetsActiveTab: React.FC<BetsActiveTabProps> = ({ eventId, eventDetailData }) => {
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
        
        const response = await betsAPI.getAll({
          eventId,
          status: ["active", "pending"].join(","), // Only active/pending bets
          limit: 100 // Limit to 100 bets for performance during live event
        });
        
        if (response.success && response.data) {
          setActiveBets(response.data.bets || []);
        } else {
          setError(response.error || "Error loading active bets");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading active bets");
        console.error("Error fetching active bets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveBets();
  }, [eventId]);

  // Calculate statistics
  const totalActiveAmount = activeBets.reduce((sum, bet) => sum + (bet.amount || 0), 0);
  const totalActiveBets = activeBets.length;
  const uniqueUsers = new Set(activeBets.map(bet => bet.userId)).size;

  if (loading) {
    return <LoadingSpinner text="Cargando apuestas activas..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card
          variant="stat"
          title="Usuarios Conectados"
          value={eventDetailData?.event?.currentViewers || 0}
          color="blue"
        />
        <Card
          variant="stat"
          title="Apuestas Activas"
          value={totalActiveBets}
          color="yellow"
        />
        <Card
          variant="stat"
          title="Volumen Total"
          value={`$${totalActiveAmount.toLocaleString()}`}
          color="green"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Monitor de Apuestas Activas ({totalActiveBets})
          </h3>
          <div className="text-sm text-gray-600">
            Actualizado en tiempo real
          </div>
        </div>

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
                        {bet.id?.substring(0, 8) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bet.userId?.substring(0, 8) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${bet.amount?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bet.selectedSide || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          bet.status === 'active' || bet.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : bet.status === 'won'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {bet.status?.charAt(0).toUpperCase() + bet.status?.slice(1) || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bet.createdAt
                          ? new Date(bet.createdAt).toLocaleTimeString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">Acciones Rápidas</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
            Pausar Apuestas
          </button>
          <button className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm">
            Pausar Stream
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
            Abrir Nueva Pelea
          </button>
        </div>
      </div>
    </div>
  );
};

export default BetsActiveTab;
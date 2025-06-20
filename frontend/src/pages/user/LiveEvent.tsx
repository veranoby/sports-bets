import { useState, useEffect, useCallback } from "react";
import { Plus, Clock, Scale, Users, Info } from "lucide-react";
import { useParams } from "react-router-dom";
import { useFights, useBets } from "../../hooks/useApi";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";

type Fight = {
  id: string;
  breeder1: string;
  breeder2: string;
  weight: number;
  status: "preliminar" | "en_curso" | "finalizado";
};

type Bet = {
  id: string;
  amount: number;
  odds: number;
  breeder: string;
  createdBy: string;
  createdAt: string;
};

const LiveEvent = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const { fights, fetchFights, loading, error } = useFights();
  const { bets, fetchBets, loadingBets, errorBets } = useBets();
  const [activeTab, setActiveTab] = useState<"available" | "my_bets" | "info">(
    "available"
  );
  const { isConnected, joinRoom, leaveRoom, addListener, removeListener } =
    useWebSocketContext();

  // ✅ 1. Room Management: Unirse a la room del evento
  useEffect(() => {
    if (isConnected && eventId) {
      joinRoom(eventId);
      return () => leaveRoom(eventId);
    }
  }, [isConnected, eventId, joinRoom, leaveRoom]);

  // ✅ 2. Listeners para actualizaciones en tiempo real
  useEffect(() => {
    if (!isConnected || !eventId) return;

    const handleStreamUpdate = (data: { status: string }) => {
      console.log("Stream actualizado:", data.status);
    };

    const handleFightUpdate = (data: { fightId: string; status: string }) => {
      console.log("Pelea actualizada:", data);
      fetchFights({ eventId });
    };

    const handleNewBet = () => {
      fetchBets();
    };

    addListener("stream:status", handleStreamUpdate);
    addListener("fight:updated", handleFightUpdate);
    addListener("bet:new", handleNewBet);

    return () => {
      removeListener("stream:status", handleStreamUpdate);
      removeListener("fight:updated", handleFightUpdate);
      removeListener("bet:new", handleNewBet);
    };
  }, [
    isConnected,
    eventId,
    addListener,
    removeListener,
    fetchFights,
    fetchBets,
  ]);

  // ✅ 3. Cargar datos iniciales
  useEffect(() => {
    if (eventId) {
      fetchFights({ eventId });
      fetchBets();
    }
  }, [eventId]);

  const handleAcceptBet = useCallback((betId: string) => {
    console.log("Aceptando apuesta:", betId);
  }, []);

  if (loading) return <LoadingSpinner text="Cargando evento..." />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Video Player */}
      <div className="aspect-video bg-black relative">
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <p className="text-lg">Transmisión en vivo simulada</p>
            <p className="text-sm text-gray-300 mt-2">Calidad: 720p</p>
          </div>
        </div>
      </div>

      {/* Fight Info */}
      <div className="bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Pelea Actual</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">{fights[0]?.breeder1}</p>
            <p className="text-gray-600">vs</p>
            <p className="font-medium">{fights[0]?.breeder2}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-gray-700">
              <Scale className="mr-2" size={16} />
              <span>{fights[0]?.weight} kg</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Clock className="mr-2" size={16} />
              <span>
                {fights[0]?.status === "en_curso"
                  ? "En curso"
                  : fights[0]?.status === "preliminar"
                  ? "Preliminar"
                  : "Finalizado"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab("available")}
          className={`flex-1 py-3 font-medium flex items-center justify-center gap-2 ${
            activeTab === "available"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600"
          }`}
        >
          <Users size={16} />
          <span>Disponibles</span>
        </button>
        <button
          onClick={() => setActiveTab("my_bets")}
          className={`flex-1 py-3 font-medium flex items-center justify-center gap-2 ${
            activeTab === "my_bets"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600"
          }`}
        >
          <Clock size={16} />
          <span>Mis Apuestas</span>
        </button>
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 py-3 font-medium flex items-center justify-center gap-2 ${
            activeTab === "info"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600"
          }`}
        >
          <Info size={16} />
          <span>Info</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "available" && (
          <div>
            <h3 className="font-semibold mb-3">Apuestas Disponibles</h3>
            <div className="space-y-3">
              {bets.map((bet) => (
                <div key={bet.id} className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{bet.breeder}</p>
                      <p className="text-sm text-gray-600">
                        Monto: ${bet.amount}
                      </p>
                      <p className="text-sm text-gray-600">
                        Cuota: {bet.odds}x
                      </p>
                    </div>
                    <button
                      onClick={() => handleAcceptBet(bet.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Aceptar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Creada por {bet.createdBy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "my_bets" && (
          <div>
            <h3 className="font-semibold mb-3">Mis Apuestas</h3>
            {bets.length === 0 ? (
              <EmptyState message="No tienes apuestas activas" />
            ) : (
              <div className="space-y-3">
                {bets.map((bet) => (
                  <div
                    key={bet.id}
                    className="bg-white p-3 rounded-lg shadow-sm"
                  >
                    <p className="font-medium">{bet.breeder}</p>
                    <p className="text-sm text-gray-600">
                      Monto: ${bet.amount}
                    </p>
                    <p className="text-sm text-gray-600">Cuota: {bet.odds}x</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Creada el {new Date(bet.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div>
            <h3 className="font-semibold mb-3">Información del Evento</h3>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-gray-700">
                Evento: Gran Campeonato Nacional de Gallos 2023
              </p>
              <p className="text-gray-700 mt-2">
                Ubicación: Arena Gallística Central
              </p>
              <p className="text-gray-700 mt-2">Hora: 15:00 - 22:00</p>
              <p className="text-gray-700 mt-2">
                Organizador: Asociación Nacional de Criadores
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create New Bet Button */}
      <div className="fixed bottom-20 right-6">
        <button className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
};

export default LiveEvent;

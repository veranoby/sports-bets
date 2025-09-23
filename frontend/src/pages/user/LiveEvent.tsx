// frontend/src/pages/user/LiveEvent.tsx - VERSIÓN CORREGIDA V2
// ===============================================================
// FIX CRÍTICO: Cambio useEvent → useEvents + fetchEventById
// OPTIMIZADO: WebSocket singleton, CSS estático, Memory leak free

import { useState, useEffect, useCallback, memo } from "react";
import {
  Plus,
  Clock,
  Scale,
  Users,
  ArrowLeft,
  Crown,
  Activity,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

// ✅ FIX PRINCIPAL: useEvents en lugar de useEvent
import { useEvents, useFights, useBets } from "../../hooks/useApi";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import SubscriptionGuard from "../../components/shared/SubscriptionGuard";
import { useWebSocketListener } from "../../hooks/useWebSocket";

// Tipos TypeScript
type Fight = {
  id: string;
  redCorner: string;
  blueCorner: string;
  weight: number;
  status: "scheduled" | "betting" | "live" | "completed";
  number: number;
  eventId: string;
};

type Bet = {
  id: string;
  amount: number;
  odds: number;
  choice: string;
  createdBy: string;
  createdAt: string;
  status: "active" | "matched" | "won" | "lost";
};

type EventData = {
  id: string;
  name: string;
  description?: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  scheduledDate: string;
  venue?: {
    id: string;
    name: string;
    location: string;
  };
  streamUrl?: string;
  currentViewers?: number;
  totalFights: number;
  completedFights: number;
};

// ✅ Componentes memoizados para prevenir re-renders
const VideoPlayer = memo(
  ({ streamUrl, eventId }: { streamUrl?: string; eventId: string }) => (
    <div className="aspect-video bg-black relative rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center text-white">
        {streamUrl ? (
          <video src={streamUrl} controls className="w-full h-full" autoPlay />
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full animate-pulse"></div>
            </div>
            <p className="text-lg font-medium">Transmisión en Vivo</p>
            <p className="text-sm text-gray-300">Evento #{eventId}</p>
          </div>
        )}
      </div>
    </div>
  ),
);

const ChatComponent = memo(() => (
  <div className="bg-[#1a1f37]/50 rounded-lg p-4">
    <h3 className="text-theme-primary font-semibold mb-3">Chat en Vivo</h3>
    <div className="space-y-2 max-h-40 overflow-y-auto">
      <div className="text-sm">
        <span className="text-blue-400 font-medium">Usuario123:</span>
        <span className="text-theme-light ml-2">¡Vamos El Campeón!</span>
      </div>
      <div className="text-sm">
        <span className="text-green-400 font-medium">Apostador456:</span>
        <span className="text-theme-light ml-2">Gran pelea 🔥</span>
      </div>
    </div>
    <div className="mt-3 flex gap-2">
      <input
        type="text"
        placeholder="Escribe un mensaje..."
        className="flex-1 bg-[#2a325c] text-theme-light px-3 py-2 rounded text-sm"
      />
      <button className="btn-primary px-4 py-2 text-sm">Enviar</button>
    </div>
  </div>
));

const BettingPanel = memo(
  ({
    availableBets,
    onAcceptBet,
  }: {
    availableBets: Bet[];
    onAcceptBet: (betId: string) => void;
  }) => (
    <div className="space-y-3">
      <h3 className="font-semibold text-theme-primary">Apuestas Disponibles</h3>
      {availableBets.length === 0 ? (
        <EmptyState
          title="No hay apuestas disponibles"
          description="Sé el primero en crear una apuesta"
        />
      ) : (
        <div className="space-y-2">
          {availableBets.map((bet) => (
            <div
              key={bet.id}
              className="card-background p-3 rounded-lg border border-[#596c95]/20"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-theme-primary">{bet.choice}</p>
                  <p className="text-sm text-theme-light">Cuota: {bet.odds}x</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400">${bet.amount}</p>
                  <p className="text-xs text-theme-light">{bet.createdBy}</p>
                </div>
              </div>
              <button
                onClick={() => onAcceptBet(bet.id)}
                className="w-full btn-primary py-2 text-sm"
              >
                Aceptar Apuesta
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  ),
);

// ✅ COMPONENTE PRINCIPAL CORREGIDO
const LiveEvent = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ✅ FIX: Usar useEvents + fetchEventById en lugar de useEvent
  const {
    events,
    fetchEventById,
    loading: eventLoading,
    error: eventError,
  } = useEvents();

  const { fights, fetchFights, loading: fightsLoading } = useFights();

  const {
    bets,
    fetchAvailableBets,
    acceptBet,
    loading: betsLoading,
  } = useBets();

  // Estados locales
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "my_bets" | "info">(
    "available",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket context
  const { isConnected, joinRoom, leaveRoom } = useWebSocketContext();

  // ✅ Fetch inicial del evento específico
  const loadEventData = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch evento específico por ID
      const eventData = await fetchEventById(eventId);
      setCurrentEvent(eventData);

      // Fetch relacionados
      await Promise.all([
        fetchFights({ eventId }),
        fetchAvailableBets({ eventId }),
      ]);
    } catch (err: any) {
      setError(err.message || "Error cargando evento");
    } finally {
      setLoading(false);
    }
  }, [eventId, fetchEventById, fetchFights, fetchAvailableBets]);

  // ✅ WebSocket room management
  useEffect(() => {
    if (isConnected && eventId) {
      joinRoom(eventId);
      return () => leaveRoom(eventId);
    }
  }, [isConnected, eventId, joinRoom, leaveRoom]);

  // ✅ WebSocket listeners para updates en tiempo real
  useWebSocketListener(
    "fight_updated",
    useCallback(
      (data: any) => {
        console.log("🥊 Fight actualizada:", data);
        if (data.eventId === eventId) {
          fetchFights({ eventId });
        }
      },
      [eventId, fetchFights],
    ),
  );

  useWebSocketListener(
    "bet_created",
    useCallback(
      (data: any) => {
        console.log("💰 Nueva apuesta:", data);
        if (data.eventId === eventId) {
          fetchAvailableBets({ eventId });
        }
      },
      [eventId, fetchAvailableBets],
    ),
  );

  useWebSocketListener(
    "event_updated",
    useCallback(
      (data: any) => {
        console.log("📺 Evento actualizado:", data);
        if (data.id === eventId) {
          setCurrentEvent((prev) => (prev ? { ...prev, ...data } : null));
        }
      },
      [eventId],
    ),
  );

  // ✅ Load data on mount
  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // ✅ Handlers
  const handleAcceptBet = useCallback(
    async (betId: string) => {
      try {
        await acceptBet(betId);
        // Refresh bets después de aceptar
        await fetchAvailableBets({ eventId });
      } catch (err: any) {
        setError(err.message || "Error aceptando apuesta");
      }
    },
    [acceptBet, fetchAvailableBets, eventId],
  );

  const handleCreateBet = useCallback(() => {
    // TODO: Abrir modal de crear apuesta
    console.log("🎯 Crear nueva apuesta");
  }, []);

  // ✅ Loading y error states
  if (loading || eventLoading) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center">
        <LoadingSpinner text="Cargando evento en vivo..." />
      </div>
    );
  }

  if (error || eventError) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center p-4">
        <ErrorMessage
          error={error || eventError || "Error desconocido"}
          onRetry={loadEventData}
        />
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center p-4">
        <EmptyState
          title="Evento no encontrado"
          description="El evento que buscas no existe o ha sido eliminado"
        />
      </div>
    );
  }

  // ✅ Data para las tabs
  const availableBets = bets?.filter((bet) => bet.status === "active") || [];
  const myBets =
    bets?.filter((bet) => bet.createdBy === "current-user-id") || [];
  const currentFight = fights?.find((fight) => fight.status === "live");
  const upcomingFights =
    fights?.filter((fight) => fight.status === "scheduled") || [];

  return (
    <SubscriptionGuard
      feature="streaming en vivo"
      showUpgradePrompt={true}
      fallback={
        <div className="card-background p-8 text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h2 className="text-xl font-bold text-theme-primary mb-2">
            Streaming Premium
          </h2>
          <p className="text-theme-light mb-6">
            Actualiza tu plan para disfrutar de transmisiones en vivo y apostar
            en tiempo real.
          </p>

          {/* Información del evento visible sin suscripción */}
          <div className="bg-[#1a1f37]/50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-theme-primary mb-1">
              {currentEvent?.name}
            </h3>
            <p className="text-sm text-theme-light">
              {currentEvent?.venue?.name}
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{currentEvent?.currentViewers || 0} espectadores</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>{fights?.length || 0} peleas programadas</span>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="min-h-screen page-background pb-20">
        {/* ✅ Added breadcrumbs */}
        <nav className="flex items-center space-x-1 text-xs text-theme-light mb-4 px-4 pt-2">
          <button
            onClick={() => navigate("/events")}
            className="flex items-center hover:text-theme-primary transition-colors"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Eventos
          </button>
          <ChevronRight className="w-3 h-3 text-gray-500" />
          <span className="text-theme-primary font-medium truncate max-w-32">
            {currentEvent?.name}
          </span>
        </nav>

        {/* ✅ Header con navegación */}
        <header className="sticky top-0 z-10 card-background shadow-sm">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[#2a325c]/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-theme-light" />
            </button>

            <div className="text-center flex-1">
              <h1 className="text-lg font-bold text-theme-primary">
                {currentEvent.name}
              </h1>
              {currentEvent.status === "in-progress" && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400 text-xs font-medium">
                    EN VIVO
                  </span>
                </div>
              )}
            </div>

            <div className="w-9"> {/* Spacer para centrar título */}</div>
          </div>
        </header>

        {/* ✅ Video Player */}
        <div className="p-4">
          <VideoPlayer
            streamUrl={currentEvent.streamUrl}
            eventId={currentEvent.id}
          />
        </div>

        {/* ✅ Current Fight Info */}
        {currentFight && (
          <div className="mx-4 mb-4 card-background p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-theme-primary">Pelea Actual</h3>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">En curso</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="font-medium text-theme-primary">
                  {currentFight.redCorner}
                </p>
                <p className="text-sm text-theme-light">Esquina Roja</p>
              </div>

              <div className="text-center px-4">
                <Scale className="w-6 h-6 text-theme-light mx-auto mb-1" />
                <p className="text-sm text-theme-light">
                  {currentFight.weight}kg
                </p>
              </div>

              <div className="text-center">
                <p className="font-medium text-theme-primary">
                  {currentFight.blueCorner}
                </p>
                <p className="text-sm text-theme-light">Esquina Azul</p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Stats rápidas */}
        <div className="mx-4 mb-4 grid grid-cols-3 gap-3">
          <div className="card-background p-3 rounded-lg text-center">
            <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-sm text-theme-light">Peleas</p>
            <p className="font-bold text-theme-primary">
              {currentEvent.completedFights}/{currentEvent.totalFights}
            </p>
          </div>

          <div className="card-background p-3 rounded-lg text-center">
            <Users className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-sm text-theme-light">Espectadores</p>
            <p className="font-bold text-theme-primary">
              {currentEvent.currentViewers || 0}
            </p>
          </div>

          <div className="card-background p-3 rounded-lg text-center">
            <Scale className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-sm text-theme-light">Apuestas</p>
            <p className="font-bold text-theme-primary">
              {availableBets.length}
            </p>
          </div>
        </div>

        {/* ✅ Tabs Navigation */}
        <div className="mx-4 mb-4">
          <div className="flex bg-[#1a1f37]/30 rounded-lg p-1">
            {[
              {
                key: "available",
                label: "Disponibles",
                count: availableBets.length,
              },
              { key: "my_bets", label: "Mis Apuestas", count: myBets.length },
              { key: "info", label: "Info", count: null },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-[#596c95] text-white"
                    : "text-theme-light hover:text-theme-primary"
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-1 text-xs">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ✅ Tab Content */}
        <div className="mx-4">
          {activeTab === "available" && (
            <BettingPanel
              availableBets={availableBets}
              onAcceptBet={handleAcceptBet}
            />
          )}

          {activeTab === "my_bets" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-theme-primary">Mis Apuestas</h3>
              {myBets.length === 0 ? (
                <EmptyState
                  title="No tienes apuestas activas"
                  description="Crea tu primera apuesta o acepta una existente"
                />
              ) : (
                <div className="space-y-2">
                  {myBets.map((bet) => (
                    <div
                      key={bet.id}
                      className="card-background p-3 rounded-lg border border-[#596c95]/20"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-theme-primary">
                            {bet.choice}
                          </p>
                          <p className="text-sm text-theme-light">
                            Cuota: {bet.odds}x • ${bet.amount}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            bet.status === "active"
                              ? "bg-blue-500/20 text-blue-400"
                              : bet.status === "won"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {bet.status === "active"
                            ? "Activa"
                            : bet.status === "won"
                              ? "Ganada"
                              : "Perdida"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "info" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-theme-primary">
                Información del Evento
              </h3>

              <div className="card-background p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-theme-light text-sm">Evento</p>
                  <p className="text-theme-primary font-medium">
                    {currentEvent.name}
                  </p>
                </div>

                {currentEvent.venue && (
                  <div>
                    <p className="text-theme-light text-sm">Ubicación</p>
                    <p className="text-theme-primary font-medium">
                      {currentEvent.venue.name}
                    </p>
                    <p className="text-theme-light text-sm">
                      {currentEvent.venue.location}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-theme-light text-sm">Fecha y Hora</p>
                  <p className="text-theme-primary font-medium">
                    {new Date(currentEvent.scheduledDate).toLocaleString(
                      "es-ES",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>

                {currentEvent.description && (
                  <div>
                    <p className="text-theme-light text-sm">Descripción</p>
                    <p className="text-theme-primary">
                      {currentEvent.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Próximas peleas */}
              {upcomingFights.length > 0 && (
                <div>
                  <h4 className="font-semibold text-theme-primary mb-2">
                    Próximas Peleas
                  </h4>
                  <div className="space-y-2">
                    {upcomingFights.slice(0, 3).map((fight) => (
                      <div
                        key={fight.id}
                        className="card-background p-3 rounded-lg"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-theme-primary font-medium">
                            Pelea #{fight.number}
                          </span>
                          <span className="text-theme-light text-sm">
                            {fight.weight}kg
                          </span>
                        </div>
                        <p className="text-sm text-theme-light mt-1">
                          {fight.redCorner} vs {fight.blueCorner}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ✅ Chat Component (solo en eventos en vivo) */}
        {currentEvent.status === "in-progress" && (
          <div className="mx-4 mt-6">
            <ChatComponent eventId={currentEvent.id} />
          </div>
        )}
      </div>

      {/* ✅ Floating Create Bet Button */}
      <div className="fixed bottom-24 right-6">
        <button
          onClick={handleCreateBet}
          className="bg-gradient-to-r from-[#596c95] to-[#cd6263] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </SubscriptionGuard>
  );
};

export default LiveEvent;

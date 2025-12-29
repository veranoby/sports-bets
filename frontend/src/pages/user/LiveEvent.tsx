// frontend/src/pages/user/LiveEvent.tsx - REFACTOR COMPLETE
// ===============================================================
// REFACTOR: Event and venue info row, conditional video player, betting panel refactor
// REMOVED: Chat component, added countdown for pre-event, redundant info section removed
// OPTIMIZED: WebSocket for betting, SSE pattern for general updates
//
// Real-time architecture per SDD (brain/sdd_system.json:20-36):
// SSE for reads (fight updates, bet creation, general event updates),

import { useState, useEffect, useCallback, memo } from "react";
import {
  Scale,
  Users,
  Crown,
  Activity,
  Calendar,
  ChevronRight,
  MapPin,
  User,
  Timer,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner"; // For toast notifications

// ✅ FIX PRINCIPAL: useEvents en lugar de useEvent
import { useEvents, useBets } from "../../hooks/useApi";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EmptyState from "../../components/shared/EmptyState";
import SubscriptionGuard from "../../components/shared/SubscriptionGuard";
import VideoPlayer from "../../components/streaming/VideoPlayer";
import useSSE, { SSEEventType } from "../../hooks/useSSE";
import { Fight, Bet, EventData } from "../../types"; // Import global types
import BettingPanelComponent from "../../components/user/BettingPanel"; // Import global BettingPanel

// Modal for fight preview
const FightPreviewModal = memo(
  ({
    fights,
    currentFight,
    completedFights,
    scheduledFights,
    onClose,
  }: {
    fights: Fight[];
    currentFight?: Fight;
    completedFights: Fight[];
    scheduledFights: Fight[];
    onClose: () => void;
  }) => {
    const navigate = useNavigate();
    console.log("📱 FightPreviewModal: Recibió props:", {
      fightsCount: fights.length,
      currentFight,
      completedFightsCount: completedFights.length,
      scheduledFightsCount: scheduledFights.length,
    });

    const getFightStatusText = (status: Fight["status"]) => {
      switch (status) {
        case "draft":
          return "Borrador";
        case "scheduled":
          return "Programada";
        case "ready":
          return "Próxima";
        case "betting_open":
          return "Apuestas Abiertas";
        case "in_progress":
          return "En Progreso";
        case "completed":
          return "Finalizada";
        case "cancelled":
          return "Cancelada";
        default:
          return "Desconocido";
      }
    };

    const getFightStatusColor = (status: Fight["status"]) => {
      switch (status) {
        case "draft":
          return "text-gray-600";
        case "scheduled":
          return "text-blue-600";
        case "ready":
          return "text-yellow-600";
        case "betting_open":
          return "text-green-600";
        case "in_progress":
          return "text-red-600";
        case "completed":
          return "text-purple-600";
        case "cancelled":
          return "text-gray-600";
        default:
          return "text-gray-500";
      }
    };

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Vista Previa de Peleas
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Current Fight */}
            {currentFight && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" />
                  Pelea Actual
                </h3>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p className="text-sm text-red-600 rounded-full px-2 py-1 border border-red-500 ">
                        {currentFight.redCorner}
                      </p>
                      <p className="text-xs text-gray-500">Esquina Roja</p>
                    </div>

                    {currentFight.weight && (
                      <div className="text-center">
                        <Scale className="w-4 h-4 text-gray-700 mx-auto mb-1" />
                        <p className="text-xs">{currentFight.weight}kg</p>
                        <p className="text-xs text-gray-500">Peso</p>
                      </div>
                    )}

                    <div className="text-center">
                      <p className="text-sm text-blue-600 rounded-full px-2 py-1 border border-blue-500">
                        {currentFight.blueCorner}
                      </p>
                      <p className="text-xs text-gray-500">Esquina Azul</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Completed Fights */}
            {completedFights.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">
                  Peleas Completadas
                </h3>
                <div className="space-y-2">
                  {completedFights.map((fight) => (
                    <div key={fight.id} className="bg-green-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>
                          {fight.number}. {fight.redCorner} vs{" "}
                          {fight.blueCorner}
                        </span>
                        <span className="text-green-600 text-sm">
                          {getFightStatusText(fight.status)}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/live-event/${fight.eventId}`)}
                        className="w-full mt-2 btn-primary py-1 text-sm"
                      >
                        Ver Resultado
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled/Upcoming Fights */}
            {scheduledFights.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Próximas Peleas</h3>
                <div className="space-y-2">
                  {scheduledFights.map((fight) => (
                    <div key={fight.id} className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <p>
                          {fight.number}.{" "}
                          <span className="text-sm text-red-600 rounded-full px-2 py-1 border border-red-500">
                            {fight.redCorner}
                          </span>{" "}
                          vs{" "}
                          <span className="text-sm text-blue-600 rounded-full px-2 py-1 border border-blue-500">
                            {fight.blueCorner}
                          </span>
                        </p>
                        <p
                          className={`text-sm ${getFightStatusColor(fight.status)}`}
                        >
                          {getFightStatusText(fight.status)}
                        </p>
                      </div>
                      {fight.weight && (
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm">{fight.weight}kg</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!currentFight &&
              completedFights.length === 0 &&
              scheduledFights.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay peleas programadas para este evento</p>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  },
);

// Countdown component for pre-event - Original Dark Theme
const CountdownTimer = memo(({ scheduledDate }: { scheduledDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const eventTime = new Date(scheduledDate).getTime();
      const now = new Date().getTime();
      const difference = eventTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60),
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [scheduledDate]);

  const { days, hours, minutes, seconds } = timeLeft;

  return (
    <div className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/30">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Timer className="w-6 h-6 text-blue-400 mr-2" />
          <h3 className="text-xl font-bold text-theme-primary">Próximamente</h3>
        </div>
        <p className="text-theme-light mb-6">El evento comenzará en:</p>

        <div className="flex justify-center gap-2">
          <div className="text-center">
            <div className="bg-white text-theme-primary text-xl font-bold w-12 h-12 flex items-center justify-center rounded-lg">
              {days}
            </div>
            <span className="text-xs text-theme-light mt-1 block">Días</span>
          </div>

          <div className="text-center">
            <div className="bg-white text-theme-primary text-xl font-bold w-12 h-12 flex items-center justify-center rounded-lg">
              {hours}
            </div>
            <span className="text-xs text-theme-light mt-1 block">Horas</span>
          </div>

          <div className="text-center">
            <div className="bg-white text-theme-primary text-xl font-bold w-12 h-12 flex items-center justify-center rounded-lg">
              {minutes}
            </div>
            <span className="text-xs text-theme-light mt-1 block">Min</span>
          </div>

          <div className="text-center">
            <div className="bg-white text-theme-primary text-xl font-bold w-12 h-12 flex items-center justify-center rounded-lg">
              {seconds}
            </div>
            <span className="text-xs text-theme-light mt-1 block">Seg</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// Component for streaming status indicators
const StreamingStatus = memo(
  ({ currentViewers }: { currentViewers?: number }) => (
    <div className="flex items-center gap-3 text-sm text-theme-light">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>En vivo</span>
      </div>
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4" />
        <span>{currentViewers || 0} espectadores</span>
      </div>
    </div>
  ),
);

const StreamingContainer = memo(
  ({
    streamUrl,
    streamStatus,
    eventId,
    currentViewers,
  }: {
    streamUrl?: string;
    streamStatus?: string;
    eventId: string;
    currentViewers?: number;
  }) => (
    <div className="relative">
      {streamUrl && streamStatus === "connected" ? (
        <>
          <VideoPlayer src={streamUrl} streamId={eventId} />
          {currentViewers !== undefined && (
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
              <Users className="w-3 h-3 inline mr-1" />
              {currentViewers}
            </div>
          )}
        </>
      ) : (
        <div className="aspect-video bg-black/30 rounded-lg flex items-center justify-center text-white">
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full animate-pulse"></div>
            </div>
            <p className="text-lg font-medium">Esperando Transmisión</p>
            <p className="text-sm text-gray-300">
              El administrador iniciará el streaming pronto
            </p>
          </div>
        </div>
      )}
    </div>
  ),
);

// ✅ COMPONENTE PRINCIPAL CORREGIDO
const LiveEvent = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ✅ FIXED: Use singleEvent state for individual event
  const { fetchEventById, singleEventError } = useEvents();

  const { bets, fetchAvailableBets, acceptBet, fetchMyBets } = useBets();
  const { isBettingEnabled } = useFeatureFlags();

  // Estados locales
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFightModal, setShowFightModal] = useState(false);

  // Determinar si el usuario es venue
  const isVenueRole = user?.role === "venue";

  // ✅ FIXED: Fetch individual event with proper error handling + DEEP DEBUG
  const loadEventData = useCallback(async () => {
    if (!eventId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch evento específico por ID (ya incluye las peleas)
      const response = await fetchEventById(eventId);

      if (response?.success && response.data) {
        console.log(
          "✅ LiveEvent loadEventData: response.data =",
          response.data,
        );
        console.log("🥊 LiveEvent: fights in response =", response.data.fights);
        setCurrentEvent(response.data as EventData);
      } else if (!response?.success) {
        throw new Error(response?.error || "Error al cargar evento");
      } else {
        throw new Error("No se recibió información del evento");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando evento";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [eventId, fetchEventById]);

  // ✅ SSE listener for event-specific updates (read-only operations) using useSSE hook
  const apiBaseUrl =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:3001";
  const {
    status,
    error: sseError,
    subscribeToEvents,
  } = useSSE(eventId ? `${apiBaseUrl}/api/sse/public/events/${eventId}` : null);

  useEffect(() => {
    if (!eventId || status !== "connected") return;

    const unsubscribe = subscribeToEvents({
      // Handle fight updates - Use SSE data to reconcile fights array
      FIGHT_STATUS_UPDATE: (data) => {
        const fightData = data.data as Fight;
        if (fightData?.eventId === eventId && fightData?.id) {
          console.log("🥊 SSE fight update received:", fightData);
          setCurrentEvent((prev) => {
            if (!prev) return null;
            // Reconcile: Update specific fight in array
            return {
              ...prev,
              fights: prev.fights.map((fight) =>
                fight.id === fightData.id
                  ? { ...fight, ...fightData } // Merge SSE data
                  : fight,
              ),
            };
          });
        }
      },
      FIGHT_UPDATED: (data) => {
        const fightData = data.data as Fight;
        if (fightData?.eventId === eventId && fightData?.id) {
          console.log("🥊 SSE fight update received:", fightData);
          setCurrentEvent((prev) => {
            if (!prev) return null;
            // Reconcile: Update specific fight in array
            return {
              ...prev,
              fights: prev.fights.map((fight) =>
                fight.id === fightData.id
                  ? { ...fight, ...fightData } // Merge SSE data
                  : fight,
              ),
            };
          });
        }
      },
      // Handle bet updates - Trust useBets hook, SSE is notification only
      NEW_BET: (data) => {
        const betData = data.data as Bet;
        if (betData?.eventId === eventId) {
          console.log("💰 SSE NEW_BET received:", betData);
          fetchAvailableBets(eventId); // Refresh available bets
        }
      },
      BET_MATCHED: (data) => {
        const betData = data.data as Bet;
        if (betData?.eventId === eventId) {
          console.log("🤝 SSE BET_MATCHED received:", betData);
          toast.success(`¡Tu apuesta de $${betData.amount} ha sido igualada!`);
          fetchMyBets(); // Refresh my bets
          fetchAvailableBets(eventId); // Refresh available bets
        }
      },
      // Handle event updates
      EVENT_ACTIVATED: (data) => {
        const eventData = data.data as EventData;
        if (eventData?.id === eventId) {
          console.log("📡 SSE EVENT_ACTIVATED received:", eventData);
          setCurrentEvent((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ...eventData,
              fights: prev.fights,
            };
          });
        }
      },
      EVENT_COMPLETED: (data) => {
        const eventData = data.data as EventData;
        if (eventData?.id === eventId) {
          console.log("📡 SSE EVENT_COMPLETED received:", eventData);
          setCurrentEvent((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ...eventData,
              fights: prev.fights,
            };
          });
        }
      },
      STREAM_STARTED: (data) => {
        const eventData = data.data as EventData;
        if (eventData?.id === eventId) {
          console.log("📡 SSE STREAM_STARTED received:", eventData);
          setCurrentEvent((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ...eventData,
              streamStatus: "connected",
              streamUrl: eventData.streamUrl || prev?.streamUrl,
              fights: prev.fights,
            };
          });
        }
      },
      STREAM_STOPPED: (data) => {
        const eventData = data.data as EventData;
        if (eventData?.id === eventId) {
          console.log("📡 SSE STREAM_STOPPED received:", eventData);
          setCurrentEvent((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ...eventData,
              streamStatus: "disconnected",
              fights: prev.fights,
            };
          });
        }
      },
      STREAM_PAUSED: (data) => {
        const eventData = data.data as EventData;
        if (eventData?.id === eventId) {
          console.log("📡 SSE STREAM_PAUSED received:", eventData);
          setCurrentEvent((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ...eventData,
              streamStatus: "paused",
              fights: prev.fights,
            };
          });
        }
      },
      STREAM_RESUMED: (data) => {
        const eventData = data.data as EventData;
        if (eventData?.id === eventId) {
          console.log("📡 SSE STREAM_RESUMED received:", eventData);
          setCurrentEvent((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ...eventData,
              streamStatus: "connected",
              fights: prev.fights,
            };
          });
        }
      },
      // HLS distribution events
      HLS_READY: (data) => {
        const eventData = data.data as EventData;
        if (eventData?.id === eventId) {
          console.log("📡 SSE HLS ready event received:", eventData);
          setCurrentEvent((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ...eventData,
              hlsStatus: "ready",
              streamUrl: eventData.streamUrl || prev?.streamUrl,
              fights: prev.fights,
            };
          });
        }
      },
      HLS_UNAVAILABLE: (data) => {
        const eventData = data.data as EventData;
        if (eventData?.id === eventId) {
          console.log("📡 SSE HLS unavailable event received:", eventData);
          setCurrentEvent((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ...eventData,
              hlsStatus: "offline",
              fights: prev.fights,
            };
          });
        }
      },
      HLS_PROCESSING: (data) => {
        const eventData = data.data as EventData;
        if (eventData?.id === eventId) {
          console.log("📡 SSE HLS processing event received:", eventData);
          setCurrentEvent((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ...eventData,
              hlsStatus: "processing",
              fights: prev.fights,
            };
          });
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [eventId, status, subscribeToEvents, fetchAvailableBets, fetchMyBets]);

  // ✅ Load data on mount - only depend on eventId to avoid infinite loop
  useEffect(() => {
    loadEventData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // ✅ Handlers
  const handleAcceptBet = useCallback(
    async (betId: string) => {
      try {
        await acceptBet(betId);
        // Refresh bets después de aceptar
        await fetchAvailableBets(eventId);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Error aceptando apuesta";
        setError(errorMessage);
      }
    },
    [acceptBet, fetchAvailableBets, eventId],
  );

  const [showCreateBetModal, setShowCreateBetModal] = useState(false);
  const handleCreateBet = useCallback(() => {
    setShowCreateBetModal(true);
  }, []);

  // ✅ FIXED: Only show spinner while loading event data
  if (loading) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center">
        <LoadingSpinner text="Cargando evento en vivo..." />
      </div>
    );
  }

  // ✅ FIXED: Show error if data load failed
  if (error || singleEventError) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center p-4">
        <ErrorMessage
          error={error || singleEventError || "Error desconocido"}
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

  // Filter bets for the currently active fight
  const allFights = currentEvent?.fights || [];
  const activeFight =
    allFights.find(
      (f) => f.status === "betting_open" || f.status === "in_progress",
    ) || allFights.find((f) => f.status === "ready"); // Fallback to ready if no betting_open or in_progress

  console.log("🎯 LiveEvent render: currentEvent =", currentEvent);
  console.log("🥊 LiveEvent render: allFights =", allFights);

  // ✅ Fights separation for modal
  const completedFights = allFights.filter((f) => f.status === "completed");
  const scheduledFights = allFights.filter(
    (f) =>
      f.status === "scheduled" ||
      f.status === "betting_open" ||
      f.status === "ready",
  );
  console.log("📊 LiveEvent: completedFights =", completedFights.length);
  console.log("📊 LiveEvent: scheduledFights =", scheduledFights.length);

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
              {currentEvent?.venue?.profileInfo?.venueName}
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{currentEvent?.currentViewers || 0} espectadores</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>
                  {(currentEvent?.fights || []).length} peleas programadas
                </span>
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

        {/* ✅ Row 1 & 1.5 Combined: Event Info & Current Fight */}
        <div className="mx-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Event and Venue Information */}
          <div className="card-background p-4 rounded-lg border border-[#596c95]/30 h-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 h-full">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-theme-primary">
                  {currentEvent.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-theme-light" />
                  <span className="text-sm text-theme-light">
                    {currentEvent.venue?.profileInfo?.venueName ||
                      "Ubicación por confirmar"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-theme-light" />
                  <span className="text-sm text-theme-light">
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
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (currentEvent.venue?.id) {
                    navigate(`/venues/${currentEvent.venue.id}`);
                  }
                }}
                className="px-4 py-2 bg-[#596c95] text-white rounded-lg text-sm hover:bg-[#596c95]/80 transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Ver información de la gallera
              </button>
            </div>
          </div>

          {/* Column 2: Current Fight Header (Always Visible) */}
          <div className="card-background p-4 rounded-lg border border-[#596c95]/30 h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-theme-primary flex items-center gap-2">
                {activeFight ? (
                  <>
                    <Scale className="w-4 h-4" />
                    Pelea #{activeFight.number}: {activeFight.redCorner} vs{" "}
                    {activeFight.blueCorner}
                  </>
                ) : (
                  <>
                    <Scale className="w-4 h-4" />
                    No hay pelea activa
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  console.log("🔘 Ver todas clicked. Opening modal with:", {
                    allFightsCount: allFights.length,
                    completedFightsCount: completedFights.length,
                    scheduledFightsCount: scheduledFights.length,
                  });
                  setShowFightModal(true);
                }}
                className="text-xs bg-[#596c95]/20 text-theme-primary px-2 py-1 rounded hover:bg-[#596c95]/40"
              >
                Ver todas
              </button>
            </div>

            {activeFight && (
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="font-medium text-theme-primary">
                    {activeFight.redCorner}
                  </p>
                  <p className="text-xs text-theme-light">Esquina Roja</p>
                </div>

                <div className="text-center">
                  <Scale className="w-5 h-5 text-theme-light mx-auto" />
                  <p className="text-xs text-theme-light">
                    {activeFight.weight}kg
                  </p>
                </div>

                <div className="text-center">
                  <p className="font-medium text-theme-primary">
                    {activeFight.blueCorner}
                  </p>
                  <p className="text-xs text-theme-light">Esquina Azul</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Row 2: Conditional Video Player */}
        {currentEvent.status === "in_progress" ? ( // Changed from "in-progress"
          <SubscriptionGuard
            feature="video streaming"
            showUpgradePrompt={true}
            fallback={
              <div className="p-4">
                <div className="aspect-video bg-black/20 rounded-lg flex items-center justify-center text-theme-light">
                  <div className="text-center">
                    <Crown className="w-12 h-12 mx-auto text-yellow-400 mb-2" />
                    <p className="text-lg font-medium">Streaming Premium</p>
                    <p className="text-sm">
                      Actualiza a premium para ver el video
                    </p>
                  </div>
                </div>
              </div>
            }
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <StreamingStatus currentViewers={currentEvent.currentViewers} />
              </div>
              <StreamingContainer
                streamUrl={currentEvent.streamUrl}
                streamStatus={currentEvent.streamStatus}
                eventId={currentEvent.id}
                currentViewers={currentEvent.currentViewers}
              />
            </div>
          </SubscriptionGuard>
        ) : (
          // Countdown for pre-event
          <div className="p-4">
            <CountdownTimer scheduledDate={currentEvent.scheduledDate} />
          </div>
        )}

        {/* ✅ Row 3: Betting Panel (Replaced previous tabs with new structure) */}
        {isBettingEnabled && (
          <div className="mx-4 mb-6 card-background p-4 rounded-lg border border-[#596c95]/30">
            {/* Status Banner based on fight status */}
            {activeFight && (
              <div
                className={`mb-4 p-3 rounded-lg text-center font-semibold ${
                  activeFight.status === "betting_open"
                    ? "bg-green-500/20 text-green-500 border border-green-500/30"
                    : activeFight.status === "in_progress"
                      ? "bg-red-500/20 text-red-500 border border-red-500/30"
                      : activeFight.status === "completed"
                        ? "bg-purple-500/20 text-purple-500 border border-purple-500/30"
                        : "bg-blue-500/20 text-blue-500 border border-blue-500/30"
                }`}
              >
                {activeFight.status === "betting_open" && "APUESTAS ABIERTAS"}
                {activeFight.status === "in_progress" &&
                  "APUESTAS CERRADAS - PELEA EN CURSO"}
                {activeFight.status === "completed" && "PELEA FINALIZADA"}
                {(activeFight.status === "scheduled" ||
                  activeFight.status === "ready") &&
                  "PRÓXIMA PELEA"}
              </div>
            )}
            {activeFight && (
              <BettingPanelComponent
                fightId={activeFight.id}
                isBettingOpen={activeFight.status === "betting_open"}
              />
            )}
            {!activeFight && (
              <EmptyState
                title="No hay peleas activas para apostar"
                description="Esperando la próxima pelea o apertura de apuestas."
              />
            )}
          </div>
        )}

        {/* ✅ Fight Preview Modal */}
        {showFightModal && (
          <>
            {console.log("🎬 Rendering FightPreviewModal with:", {
              allFightsCount: allFights.length,
              completedFightsCount: completedFights.length,
              scheduledFightsCount: scheduledFights.length,
            })}
            <FightPreviewModal
              fights={allFights}
              currentFight={activeFight}
              completedFights={completedFights}
              scheduledFights={scheduledFights}
              onClose={() => setShowFightModal(false)}
            />
          </>
        )}
      </div>
      {showCreateBetModal && activeFight && (
        <CreateBetModal
          fightId={activeFight.id}
          onClose={() => {
            setShowCreateBetModal(false);
            fetchMyBets(); // Refresh my bets after creating one
            fetchAvailableBets(eventId); // Refresh available bets
          }}
        />
      )}
    </SubscriptionGuard>
  );
};

export default LiveEvent;

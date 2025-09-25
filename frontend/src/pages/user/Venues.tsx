// frontend/src/pages/user/Venues.tsx - Enhanced UI matching Events.tsx sophistication
// ================================================================
// Sophisticated venue listing with enhanced visual design patterns
// Following Events page design consistency and card-based layouts

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Users,
  ChevronRight,
  Star,
  Calendar,
  Building,
  Filter,
  Grid,
  List,
  Sparkles,
  Zap,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { usersAPI, articlesAPI } from "../../services/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import SearchInput from "../../components/shared/SearchInput";
import Card from "../../components/shared/Card";

interface VenueProfile {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl?: string;
  articlesCount?: number;
  establishedDate?: string;
  isVerified?: boolean;
  rating?: number;
  activeEvents?: number;
}

interface VenueUser {
  id: string;
  username: string;
  createdAt: string;
  profileInfo?: {
    businessName?: string;
    businessAddress?: string;
    verificationLevel?: "none" | "basic" | "full";
  };
}

// Enhanced Venue Card Component - Following Events page sophistication
const VenueCard = React.memo(
  ({ venue, onClick }: { venue: VenueProfile; onClick: () => void }) => {
    const hasActiveContent = venue.articlesCount && venue.articlesCount > 0;
    const isEstablished =
      venue.establishedDate &&
      new Date().getFullYear() -
        new Date(venue.establishedDate).getFullYear() >=
        2;

    return (
      <div
        className="card-background p-4 cursor-pointer hover:bg-[#2a325c]/80 transition-all duration-200 transform hover:scale-[1.02] relative overflow-hidden"
        onClick={onClick}
      >
        {/* Gradient overlay for verified venues */}
        {venue.isVerified && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-500/20 to-transparent" />
        )}

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Building className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">Local</span>
              {venue.isVerified && (
                <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-theme-light" />
        </div>

        {/* Enhanced Venue Image with overlay */}
        <div className="w-full h-36 rounded-lg overflow-hidden mb-3 relative group">
          {venue.imageUrl ? (
            <>
              <img
                src={venue.imageUrl}
                alt={venue.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              {hasActiveContent && (
                <div className="absolute top-2 right-2">
                  <span className="bg-green-500/90 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Activo
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Building className="w-8 h-8 text-theme-light/50" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-theme-primary line-clamp-1 flex-1 mr-2">
              {venue.name}
            </h3>
            {venue.activeEvents && venue.activeEvents > 0 ? (
              <span className="text-xs bg-red-500/30 text-red-400 px-2 py-1 rounded-full whitespace-nowrap animate-pulse">
                {venue.activeEvents}{" "}
                {venue.activeEvents > 1 ? "Eventos" : "Evento"}
              </span>
            ) : isEstablished ? (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full whitespace-nowrap">
                Tradicional
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2 text-sm text-theme-light">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{venue.location}</span>
          </div>

          <p className="text-sm text-theme-light line-clamp-2 leading-relaxed">
            {venue.description}
          </p>

          {venue.establishedDate && (
            <div className="flex items-center gap-2 text-xs text-theme-light">
              <Calendar className="w-3 h-3" />
              <span>
                Establecido en {new Date(venue.establishedDate).getFullYear()}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#596c95]/20">
          <div className="flex items-center gap-3">
            {venue.articlesCount !== undefined && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {venue.articlesCount} artículos
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {venue.isVerified ? (
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs font-medium">Verificado</span>
              </div>
            ) : (
              <span className="text-xs text-theme-light">En verificación</span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

const VenuesPage: React.FC = () => {
  const navigate = useNavigate();
  const { venueId } = useParams<{ venueId?: string }>();
  const [search, setSearch] = useState("");
  const [venues, setVenues] = useState<VenueProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        const response = await usersAPI.getAll({ role: "venue" });
        if (response.success) {
          const venueProfiles = await Promise.all(
            ((response.data as any)?.users || []).map(
              async (user: VenueUser) => {
                const articles = await articlesAPI.getAll({
                  author_id: user.id,
                });
                return {
                  id: user.id,
                  name: user.profileInfo?.businessName || user.username,
                  description: "Local para eventos de gallos",
                  location:
                    user.profileInfo?.businessAddress ||
                    "Ubicación no especificada",
                  imageUrl: undefined,
                  articlesCount: articles.success
                    ? (articles.data as any)?.total || 0
                    : 0,
                  establishedDate: user.createdAt,
                  isVerified:
                    user.profileInfo?.verificationLevel === "full" || false,
                  rating: 0,
                  activeEvents: 0,
                };
              },
            ),
          );
          setVenues(venueProfiles);
        } else {
          setError(
            "Error al cargar los locales. Inténtalo de nuevo más tarde.",
          );
        }
      } catch (err) {
        setError("Error al cargar los locales. Inténtalo de nuevo más tarde.");
        console.error("Error loading venues:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  const filteredVenues = venues.filter((venue) => {
    const matchesSearch =
      venue.name.toLowerCase().includes(search.toLowerCase()) ||
      venue.location.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filterActive === null
        ? true
        : filterActive
          ? venue.articlesCount && venue.articlesCount > 0
          : !venue.articlesCount || venue.articlesCount === 0;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="page-background">
        <LoadingSpinner text="Cargando locales..." className="mt-20" />
      </div>
    );
  }

  // Vista individual (simplificada)
  if (venueId) {
    const venue = venues.find((v) => v.id === venueId);
    if (!venue)
      return (
        <EmptyState
          title="Local no encontrado"
          icon={<Users className="w-12 h-12" />}
        />
      );

    return (
      <div className="page-background pb-24">
        <div className="p-4">
          <button
            onClick={() => navigate("/venues")}
            className="flex items-center gap-2 text-sm text-theme-light hover:text-theme-primary mb-4 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Volver a Locales
          </button>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card Principal de Información */}
              <div className="card-background p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  {venue.imageUrl ? (
                    <img
                      src={venue.imageUrl}
                      alt={venue.name}
                      className="w-24 h-24 rounded-lg object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <Building className="w-10 h-10 text-theme-light/50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-theme-primary mb-2">
                      {venue.name}
                    </h1>
                    <div className="flex items-center gap-2 text-theme-light">
                      <MapPin className="w-5 h-5" />
                      <span className="text-lg">{venue.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card de Descripción */}
              <div className="card-background p-6">
                <h2 className="text-xl font-semibold text-theme-primary mb-3">
                  Descripción
                </h2>
                <p className="text-theme-light leading-relaxed">
                  {venue.description}
                </p>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              {/* Card de Estadísticas */}
              <div className="card-background p-6">
                <h2 className="text-xl font-semibold text-theme-primary mb-4">
                  Estadísticas
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-theme-light">
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      Rating
                    </span>
                    <span className="font-medium text-theme-primary">
                      {venue.rating?.toFixed(1) || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-theme-light">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Fundado en
                    </span>
                    <span className="font-medium text-theme-primary">
                      {venue.establishedDate
                        ? new Date(venue.establishedDate).getFullYear()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-theme-light">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Artículos
                    </span>
                    <span className="font-medium text-theme-primary">
                      {venue.articlesCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-theme-light">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Eventos Activos
                    </span>
                    <span className="font-medium text-theme-primary">
                      {venue.activeEvents || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-theme-light">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      Estado
                    </span>
                    <span
                      className={`font-medium ${venue.isVerified ? "text-green-400" : "text-amber-400"}`}
                    >
                      {venue.isVerified ? "Verificado" : "En Verificación"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card de Artículos */}
              <div className="card-background p-6">
                <h2 className="text-xl font-semibold text-theme-primary mb-4 flex items-center gap-2">
                  <span className="text-2xl">📰</span> Artículos
                </h2>
                <EmptyState
                  title="Próximamente"
                  description="Los artículos y contenidos de este local aparecerán aquí."
                  icon={<Building className="w-10 h-10" />}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Lista view - Following Events page patterns
  return (
    <div className="page-background pb-24">
      <div className="p-4 space-y-6">
        {/* Enhanced Header with sophisticated styling */}
        <div className="card-background p-6">
          <div className="flex flex-col gap-6">
            {/* Title and Statistics */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
                  <Building className="w-6 h-6 text-blue-400" />
                  Locales de Eventos
                </h1>
                <p className="text-theme-light">
                  Descubre los mejores locales para eventos gallísticos
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setViewMode(viewMode === "grid" ? "list" : "grid")
                  }
                  className="p-2 rounded-lg hover:bg-[#2a325c]/50 transition-colors"
                  title={`Cambiar a vista ${viewMode === "grid" ? "lista" : "cuadrícula"}`}
                >
                  {viewMode === "grid" ? (
                    <List className="w-4 h-4 text-theme-light" />
                  ) : (
                    <Grid className="w-4 h-4 text-theme-light" />
                  )}
                </button>
              </div>
            </div>

            {/* Enhanced Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 p-3 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Building className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium">
                    Total Locales
                  </span>
                </div>
                <span className="text-lg font-bold text-theme-primary">
                  {venues.length}
                </span>
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 p-3 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">
                    Verificados
                  </span>
                </div>
                <span className="text-lg font-bold text-theme-primary">
                  {venues.filter((v) => v.isVerified).length}
                </span>
              </div>

              <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 p-3 rounded-lg border border-purple-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-purple-400 font-medium">
                    Artículos
                  </span>
                </div>
                <span className="text-lg font-bold text-theme-primary">
                  {venues.reduce((sum, v) => sum + (v.articlesCount || 0), 0)}
                </span>
              </div>

              <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 p-3 rounded-lg border border-amber-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">
                    Tradicionales
                  </span>
                </div>
                <span className="text-lg font-bold text-theme-primary">
                  {
                    venues.filter(
                      (v) =>
                        v.establishedDate &&
                        new Date().getFullYear() -
                          new Date(v.establishedDate).getFullYear() >=
                          2,
                    ).length
                  }
                </span>
              </div>
            </div>

            {/* Enhanced Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <SearchInput
                  placeholder="Buscar locales por nombre o ubicación..."
                  onSearch={(value) => setSearch(value)}
                  value={search}
                  showClearButton
                  debounceMs={300}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-theme-light" />
                <select
                  value={
                    filterActive === null
                      ? "all"
                      : filterActive
                        ? "active"
                        : "inactive"
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterActive(
                      value === "all" ? null : value === "active",
                    );
                  }}
                  className=" border border-[#596c95]/30 rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-blue-400 transition-colors"
                >
                  <option value="all">Todos los locales</option>
                  <option value="active">Con contenido</option>
                  <option value="inactive">Sin contenido</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error handling */}
        {error ? (
          <Card variant="error" className="p-4">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Reintentar
              </button>
            </div>
          </Card>
        ) : !filteredVenues.length ? (
          <EmptyState
            title="No se encontraron locales"
            description={
              search
                ? "No hay locales que coincidan con tu búsqueda"
                : "No hay locales registrados en este momento"
            }
            icon={<Building className="w-12 h-12" />}
            action={
              search ? (
                <button
                  onClick={() => setSearch("")}
                  className="btn-ghost text-sm"
                >
                  Limpiar búsqueda
                </button>
              ) : undefined
            }
          />
        ) : (
          /* Enhanced Venues Grid */
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-400" />
              Locales Disponibles ({filteredVenues.length})
            </h2>

            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {filteredVenues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onClick={() => navigate(`/venues/${venue.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenuesPage;

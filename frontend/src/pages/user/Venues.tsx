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
import { venuesAPI, articlesAPI } from "../../services/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import SearchInput from "../../components/shared/SearchInput";
import Card from "../../components/shared/Card";

interface VenueProfile {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl?: string; // Main image for the card (will be gallery or owner)
  ownerImage?: string; // Owner's specific profile image
  galleryImages?: string[]; // Gallery images for the venue itself
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
              <Building className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Gallera</span>
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
              {/* Owner Profile Image - Top Left */}
              {venue.ownerImage && (
                <div className="absolute top-2 left-2">
                  <img
                    src={venue.ownerImage}
                    alt="Owner"
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/80 shadow-lg"
                  />
                </div>
              )}
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
              <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-1 rounded-full whitespace-nowrap">
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

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#596c9536]/20">
          <div className="flex items-center gap-3">
            {venue.articlesCount !== undefined && (
              <span className="text-xs text-green-600 flex items-center gap-1">
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
        const response = await venuesAPI.getAll();
        if (response.success) {
          const venueProfiles = await Promise.all(
            ((response.data as { users: any[] })?.users || []).map(
              async (venue: any) => {
                const articles = await articlesAPI.getAll({
                  author_id: venue.owner?.id || venue.id,
                });
                return {
                  id: venue.id,
                  name: venue.name || "Gallera sin nombre",
                  description: venue.description || "Información no disponible",
                  location: venue.location || "Ubicación no especificada",
                  imageUrl: venue.images?.[0] || venue.owner?.profileInfo?.profileImage,
                  ownerImage: venue.owner?.profileInfo?.profileImage,
                  galleryImages: venue.images || [],
                  articlesCount: articles.success
                    ? (articles.data as { total: number })?.total || 0
                    : 0,
                  establishedDate: venue.createdAt,
                  isVerified:
                    venue.owner?.profileInfo?.verificationLevel === "full" || false,
                  rating: venue.owner?.profileInfo?.rating || 0,
                  activeEvents: 0,
                };
              },
            ),
          );
          setVenues(venueProfiles);
        } else {
          setError(
            "Error al cargar las galleras. Inténtalo de nuevo más tarde.",
          );
        }
      } catch (err) {
        setError("Error al cargar las galleras. Inténtalo de nuevo más tarde.");
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
        <LoadingSpinner text="Cargando galleras..." className="mt-20" />
      </div>
    );
  }

  // Vista individual (simplificada)
  if (venueId) {
    const venue = venues.find((v) => v.id === venueId);
    if (!venue)
      return (
        <EmptyState
          title="Gallera no encontrada"
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
            Volver a Galleras
          </button>

          {/* === UNIFIED DETAIL VIEW START === */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card Principal Unificada (Info + Descripción) */}
              <div className="card-background p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  {/* Imagen del Local */}
                  {venue.imageUrl ? (
                    <img
                      src={venue.imageUrl}
                      alt={venue.name}
                      className="w-28 h-28 rounded-lg object-cover border-2 border-blue-500/50 shadow-lg"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Building className="w-12 h-12 text-theme-light/50" />
                    </div>
                  )}
                  <div className="flex-1">
                    {/* Titulo y Owner Image */}
                    <div className="flex items-start gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-theme-primary flex-1">
                        {venue.name}
                      </h1>
                      {/* Owner Profile Image */}
                      {venue.ownerImage && (
                        <img
                          src={venue.ownerImage}
                          alt="Dueño"
                          className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/50 shadow-md flex-shrink-0"
                          title="Imagen del propietario"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-theme-light mb-4">
                      <MapPin className="w-5 h-5" />
                      <span className="text-lg">{venue.location}</span>
                    </div>
                    {/* Stat Chips */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <div className="flex items-center gap-1.5 text-xs bg-gray-800/50 border border-gray-700/50 rounded-full px-3 py-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className="text-gray-300">
                          {venue.rating?.toFixed(1) || "N/A"} Rating
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs bg-gray-800/50 border border-gray-700/50 rounded-full px-3 py-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300">
                          Desde{" "}
                          {venue.establishedDate
                            ? new Date(venue.establishedDate).getFullYear()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs bg-gray-800/50 border border-gray-700/50 rounded-full px-3 py-1">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span
                          className={`font-medium ${venue.isVerified ? "text-green-600" : "text-amber-600"}`}
                        >
                          {venue.isVerified ? "Verificado" : "En Verificación"}
                        </span>
                      </div>
                    </div>
                    <p className="text-theme-light leading-relaxed">
                      {venue.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nueva Card de Galería */}
              <div className="card-background p-6">
                <h2 className="text-xl font-semibold text-theme-primary mb-4">
                  Galería
                </h2>
                {venue.galleryImages && venue.galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {venue.galleryImages.map((img, index) => (
                      <div
                        key={index}
                        className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden"
                      >
                        <img
                          src={img}
                          alt={`Galería ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Sin Imágenes"
                    description="El dueño del local aún no ha subido imágenes a la galería."
                    icon={<Building className="w-10 h-10" />}
                  />
                )}
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              {/* Card de Artículos (se mantiene) */}
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
          {/* === UNIFIED DETAIL VIEW END === */}
        </div>
      </div>
    );
  }

  // Enhanced Lista view - Following Events page patterns
  return (
    <div className="page-background pb-24">
      <div className="p-4 space-y-6">
        {/* Refactored Header */}
        <div className="space-y-4">
          {/* Title and Stat Chips */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
              <Building className="w-6 h-6 text-blue-600" />
              Galleras de Eventos
              <div className="flex items-center gap-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-full px-3 py-1">
                <span className="font-bold text-gray-100">Total:</span>
                <span className="font-bold text-white">{venues.length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-full px-3 py-1">
                <span className="font-bold text-gray-100">Verificados:</span>
                <span className="font-bold text-white">
                  {venues.filter((v) => v.isVerified).length}
                </span>
              </div>{" "}
            </h1>
          </div>

          {/* Search and Filters */}
          <div className="card-background p-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Buscar galleras por nombre o ubicación..."
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
                  setFilterActive(value === "all" ? null : value === "active");
                }}
                className="border border-[#596c9536]/30 rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-blue-400 transition-colors"
              >
                <option value="all">Todas las galleras</option>
                <option value="active">Con contenido</option>
                <option value="inactive">Sin contenido</option>
              </select>
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
            title="No se encontraron galleras"
            description={
              search
                ? "No hay galleras que coincidan con tu búsqueda"
                : "No hay galleras registradas en este momento"
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

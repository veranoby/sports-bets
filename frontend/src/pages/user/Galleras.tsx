import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Shield,
  ChevronRight,
  Calendar,
  Users,
  Star,
  Award,
  Filter,
  Grid,
  List,
  Sparkles,
  Crown,
  MapPin,
} from "lucide-react";
import { articlesAPI, usersAPI, gallerasAPI } from "../../services/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import SearchInput from "../../components/shared/SearchInput";
import Card from "../../components/shared/Card";

interface GalleraProfile {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl?: string; // Main image for the card
  ownerImage?: string; // Owner's specific profile image
  galleryImages?: string[]; // Gallery images for the gallera itself
  articlesCount: number;
  establishedDate?: string;
  isCertified?: boolean;
  rating?: number;
  specialties?: string[];
  premiumLevel?: "bronze" | "silver" | "gold" | "platinum";
}

interface GalleraUser {
  id: string;
  username: string;
  profileInfo?: {
    galleraName?: string;
    description?: string;
    location?: string;
    imageUrl?: string;
    establishedDate?: string;
    certified?: boolean;
    rating?: number;
    specialties?: string[];
    premiumLevel?: "bronze" | "silver" | "gold" | "platinum";
  };
}

// Enhanced Gallera Card Component - Following Events page sophistication with premium levels
const GalleraCard = React.memo(
  ({ gallera, onClick }: { gallera: GalleraProfile; onClick: () => void }) => {
    const getPremiumColor = (level?: string) => {
      switch (level) {
        case "platinum":
          return "from-purple-500/30 to-pink-500/30 border-purple-500/50";
        case "gold":
          return "from-yellow-500/30 to-amber-500/30 border-yellow-500/50";
        case "silver":
          return "from-gray-400/30 to-gray-500/30 border-gray-400/50";
        case "bronze":
          return "from-orange-500/30 to-red-500/30 border-orange-500/50";
        default:
          return "from-green-500/20 to-green-600/20 border-green-500/30";
      }
    };

    const getPremiumIcon = (level?: string) => {
      switch (level) {
        case "platinum":
          return <Crown className="w-3 h-3 text-purple-400" />;
        case "gold":
          return <Crown className="w-3 h-3 text-yellow-400" />;
        case "silver":
          return <Award className="w-3 h-3 text-gray-400" />;
        case "bronze":
          return <Award className="w-3 h-3 text-orange-400" />;
        default:
          return <Shield className="w-3 h-3 text-green-400" />;
      }
    };

    const hasHighArticleCount = gallera.articlesCount > 5;
    const isEstablished =
      gallera.establishedDate &&
      new Date().getFullYear() -
        new Date(gallera.establishedDate).getFullYear() >=
        5;

    return (
      <div
        className="card-background p-4 cursor-pointer hover:bg-[#2a325c]/80 transition-all duration-200 transform hover:scale-[1.02] relative overflow-hidden"
        onClick={onClick}
      >
        {/* Premium gradient overlay */}
        {gallera.premiumLevel && (
          <div
            className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${getPremiumColor(gallera.premiumLevel)} opacity-40`}
          />
        )}

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {getPremiumIcon(gallera.premiumLevel)}
              <span className="text-xs font-medium text-green-400">
                Institución
              </span>
              {gallera.isCertified && (
                <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-theme-light" />
        </div>

        {/* Enhanced Gallera Image with premium border */}
        <div
          className={`w-full h-36 rounded-lg overflow-hidden mb-3 relative group ${
            gallera.premiumLevel
              ? `border-2 bg-gradient-to-br ${getPremiumColor(gallera.premiumLevel)}`
              : ""
          }`}
        >
          {gallera.imageUrl ? (
            <>
              <img
                src={gallera.imageUrl}
                alt={gallera.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              {/* Owner Profile Image - Top Left */}
              {gallera.ownerImage && (
                <div className="absolute top-2 left-2">
                  <img
                    src={gallera.ownerImage}
                    alt="Owner"
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/80 shadow-lg"
                  />
                </div>
              )}
              {hasHighArticleCount && (
                <div className="absolute bottom-2 left-2">
                  <span className="bg-blue-500/90 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Experto
                  </span>
                </div>
              )}
              {gallera.premiumLevel && (
                <div className="absolute top-2 right-2">
                  <span
                    className={`bg-gradient-to-r ${getPremiumColor(gallera.premiumLevel)} text-white text-xs px-2 py-1 rounded-full font-medium border`}
                  >
                    {gallera.premiumLevel.toUpperCase()}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${getPremiumColor(gallera.premiumLevel)} flex items-center justify-center`}
            >
              <Shield className="w-8 h-8 text-theme-light/50" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-theme-primary line-clamp-1 flex-1 mr-2">
              {gallera.name}
            </h3>
            {isEstablished && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full whitespace-nowrap">
                Histórica
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-theme-light">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{gallera.location}</span>
          </div>

          <p className="text-sm text-theme-light line-clamp-2 leading-relaxed">
            {gallera.description}
          </p>

          {/* Specialties */}
          {gallera.specialties && gallera.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {gallera.specialties.slice(0, 3).map((specialty, index) => (
                <span
                  key={index}
                  className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full"
                >
                  {specialty}
                </span>
              ))}
            </div>
          )}

          {gallera.establishedDate && (
            <div className="flex items-center gap-2 text-xs text-theme-light">
              <Calendar className="w-3 h-3" />
              <span>
                Fundada en {new Date(gallera.establishedDate).getFullYear()}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#596c9536]/20">
          <div className="flex items-center gap-3">
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              {gallera.articlesCount} artículos
            </span>
            {gallera.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-current text-yellow-400" />
                <span className="text-xs text-yellow-400">
                  {gallera.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {gallera.isCertified ? (
              <div className="flex items-center gap-1 text-yellow-400">
                {getPremiumIcon(gallera.premiumLevel)}
                <span className="text-xs font-medium">Certificada</span>
              </div>
            ) : (
              <span className="text-xs text-theme-light">En certificación</span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

const GallerasPage: React.FC = () => {
  const navigate = useNavigate();
  const { galleraId } = useParams<{ galleraId?: string }>();
  const [galleras, setGalleras] = useState<GalleraProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [premiumFilter, setPremiumFilter] = useState<string>("all");

  useEffect(() => {
    fetchGalleras();
  }, []);

  const fetchGalleras = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get galleras from dedicated API
      const gallerasData = await gallerasAPI.getAll();
      if (gallerasData.success) {
        // Get their articles
        const galleraProfiles = await Promise.all(
          ((gallerasData.data as { galleras: any[] })?.galleras || []).map(
            async (gallera: any) => {
              const articles = await articlesAPI.getAll({
                author_id: gallera.ownerId,
              });
              const articleCount = articles.success
                ? articles.data.total || 0
                : 0;

              // Use gallera table data first, then fallback to user profileInfo
              const galleraName =
                gallera.name ||
                gallera.owner?.profileInfo?.galleraName ||
                "Gallera";
              const description =
                gallera.description ||
                gallera.owner?.profileInfo?.galleraDescription ||
                "Institución criadora profesional";
              const location =
                gallera.location ||
                gallera.owner?.profileInfo?.galleraLocation ||
                "Ecuador";

              // Extract specialties from gallera.specialties or user profile
              let specialties: string[] = [];
              if (gallera.specialties?.specialties) {
                specialties = Array.isArray(gallera.specialties.specialties)
                  ? gallera.specialties.specialties
                  : [gallera.specialties.specialties];
              } else if (gallera.owner?.profileInfo?.galleraSpecialties) {
                specialties = [gallera.owner.profileInfo.galleraSpecialties];
              }

              return {
                id: gallera.id,
                name: galleraName,
                description: description,
                location: location,
                imageUrl:
                  gallera.images?.[0] ||
                  gallera.owner?.profileInfo?.profileImage,
                ownerImage: gallera.owner?.profileInfo?.profileImage,
                galleryImages: gallera.images || [],
                articlesCount: articleCount,
                establishedDate: gallera.createdAt,
                isCertified:
                  gallera.owner?.profileInfo?.verificationLevel === "full" ||
                  false,
                rating: gallera.owner?.profileInfo?.rating || 0,
                specialties: specialties,
                premiumLevel: gallera.owner?.profileInfo?.premiumLevel,
              };
            },
          ),
        );
        setGalleras(galleraProfiles);
      } else {
        setError(
          "Error al cargar las instituciones. Inténtalo de nuevo más tarde.",
        );
      }
    } catch (err) {
      setError(
        "Error al cargar las instituciones. Inténtalo de nuevo más tarde.",
      );
      console.error("Error loading galleras:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGalleras = galleras.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPremium =
      premiumFilter === "all"
        ? true
        : premiumFilter === "premium"
          ? g.premiumLevel
          : premiumFilter === "certified"
            ? g.isCertified
            : !g.premiumLevel && !g.isCertified;

    return matchesSearch && matchesPremium;
  });

  if (loading) {
    return (
      <div className="page-background">
        <LoadingSpinner text="Cargando instituciones..." className="mt-20" />
      </div>
    );
  }

  // Individual gallera view
  if (galleraId) {
    const gallera = galleras.find((g) => g.id === galleraId);
    if (!gallera)
      return (
        <EmptyState
          title="Institución no encontrada"
          icon={<Shield className="w-12 h-12" />}
        />
      );

    return (
      <div className="page-background pb-24">
        <div className="p-4">
          <button
            onClick={() => navigate("/galleras")}
            className="flex items-center gap-2 text-sm text-theme-light hover:text-theme-primary mb-4 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Volver a Instituciones
          </button>

          {/* === UNIFIED DETAIL VIEW START === */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card Principal Unificada (Info + Descripción) */}
              <div className="card-background p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  {/* Imagen de la Gallera */}
                  {gallera.imageUrl ? (
                    <img
                      src={gallera.imageUrl}
                      alt={gallera.name}
                      className="w-28 h-28 rounded-lg object-cover border-2 border-green-500/50 shadow-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-lg bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-12 h-12 text-theme-light/50" />
                    </div>
                  )}
                  <div className="flex-1">
                    {/* Titulo y Owner Image */}
                    <div className="flex items-start gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-theme-primary flex-1">
                        {gallera.name}
                      </h1>
                      {/* Owner Profile Image */}
                      {gallera.ownerImage && (
                        <img
                          src={gallera.ownerImage}
                          alt="Dueño"
                          className="w-12 h-12 rounded-full object-cover border-2 border-green-500/50 shadow-md flex-shrink-0"
                          title="Imagen del propietario"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-theme-light mb-4">
                      <MapPin className="w-5 h-5" />
                      <span className="text-lg">{gallera.location}</span>
                    </div>
                    {/* Stat Chips */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <div className="flex items-center gap-1.5 text-xs bg-gray-800/50 border border-gray-700/50 rounded-full px-3 py-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className="text-gray-300">
                          {gallera.rating?.toFixed(1) || "N/A"} Rating
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs bg-gray-800/50 border border-gray-700/50 rounded-full px-3 py-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300">
                          Desde{" "}
                          {gallera.establishedDate
                            ? new Date(gallera.establishedDate).getFullYear()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs bg-gray-800/50 border border-gray-700/50 rounded-full px-3 py-1">
                        <Sparkles className="w-3 h-3 text-green-400" />
                        <span
                          className={`font-medium ${gallera.isCertified ? "text-green-400" : "text-amber-400"}`}
                        >
                          {gallera.isCertified
                            ? "Certificada"
                            : "En Certificación"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs bg-gray-800/50 border border-gray-700/50 rounded-full px-3 py-1">
                        <Award className="w-3 h-3 text-blue-400" />
                        <span className="text-gray-300 capitalize">
                          {gallera.premiumLevel || "Estándar"}
                        </span>
                      </div>
                    </div>
                    <p className="text-theme-light leading-relaxed">
                      {gallera.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nueva Card de Galería */}
              <div className="card-background p-6">
                <h2 className="text-xl font-semibold text-theme-primary mb-4">
                  Galería
                </h2>
                {gallera.galleryImages && gallera.galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {gallera.galleryImages.map((img, index) => (
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
                    description="El dueño de la gallera aún no ha subido imágenes a la galería."
                    icon={<Shield className="w-10 h-10" />}
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
                  description="Los artículos y contenidos de esta institución aparecerán aquí."
                  icon={<Shield className="w-10 h-10" />}
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
              <Shield className="w-6 h-6 text-green-400" />
              Instituciones Criadoras
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-full px-3 py-1">
                <span className="text-gray-400">Total:</span>
                <span className="font-bold text-white">{galleras.length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-full px-3 py-1">
                <span className="text-gray-400">Certificadas:</span>
                <span className="font-bold text-white">
                  {galleras.filter((g) => g.isCertified).length}
                </span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Buscar instituciones criadoras..."
                onSearch={(value) => setSearchTerm(value)}
                value={searchTerm}
                showClearButton
                debounceMs={300}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-light" />
              <select
                value={premiumFilter}
                onChange={(e) => setPremiumFilter(e.target.value)}
                className="border border-[#596c9536]/30 rounded-lg px-3 py-2 text-sm text-theme-primary focus:outline-none focus:border-blue-400 transition-colors"
              >
                <option value="all">Todas las instituciones</option>
                <option value="premium">Nivel Premium</option>
                <option value="certified">Certificadas</option>
                <option value="standard">Estándar</option>
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
        ) : !filteredGalleras.length ? (
          <EmptyState
            title="No se encontraron instituciones"
            description={
              searchTerm
                ? "No hay instituciones que coincidan con tu búsqueda"
                : "No hay instituciones criadoras registradas en este momento"
            }
            icon={<Shield className="w-12 h-12" />}
            action={
              searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="btn-ghost text-sm"
                >
                  Limpiar búsqueda
                </button>
              ) : undefined
            }
          />
        ) : (
          /* Enhanced Galleras Grid */
          <div className="space-y-4">
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {filteredGalleras.map((gallera) => (
                <GalleraCard
                  key={gallera.id}
                  gallera={gallera}
                  onClick={() => navigate(`/galleras/${gallera.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GallerasPage;

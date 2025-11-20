// frontend/src/pages/user/VenueDetailPage.tsx
// ================================================================
// Dedicated venue detail page component with proper venue-specific features

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { venuesAPI, articlesAPI } from "../../services/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import Card from "../../components/shared/Card";
import {
  MapPin,
  ChevronLeft,
  BookOpen,
  Calendar,
  Building,
  Star,
  Sparkles,
  Clock,
  Zap,
} from "lucide-react";
import ImageCarouselViewer from "../../components/shared/ImageCarouselViewer";

interface ArticleLite {
  id: string;
  title: string;
  summary?: string;
  createdAt?: string;
  created_at?: string;
  status: string;
  published_at?: string;
}

const VenueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<any | null>(null);
  const [articles, setArticles] = useState<ArticleLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No se proporcionó un ID de gallera.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const venueResponse = await venuesAPI.getById(id);
        if (!venueResponse.success) {
          throw new Error(venueResponse.error || "Error al cargar gallera");
        }
        const venueData = venueResponse.data as any;
        setVenue(venueData);

        // ⚡ Optimized: Try ownerId first, then fallback to owner data
        let ownerId = venueData.ownerId || venueData.owner?.id;

        // Fallback: If no ownerId, try to find via owner relationship (for compatibility)
        if (!ownerId && venueData.owner?.id) {
          ownerId = venueData.owner.id;
        }

        if (ownerId) {
          const articlesResponse = await articlesAPI.getAll({
            author_id: ownerId,
          });
          if (articlesResponse.success) {
            setArticles(
              (articlesResponse.data as { articles: ArticleLite[] })
                ?.articles || [],
            );
          }
        }
      } catch (err) {
        console.error("Error fetching venue data:", err);
        setError("No se pudo cargar la gallera. Inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading)
    return (
      <div className="page-background">
        <LoadingSpinner text="Cargando gallera..." className="mt-20" />
      </div>
    );

  if (error)
    return (
      <div className="page-background p-4">
        <Card variant="error" className="p-6">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => navigate("/venues")} className="btn-primary">
              Volver a Galleras
            </button>
          </div>
        </Card>
      </div>
    );

  if (!venue)
    return (
      <div className="page-background p-4">
        <EmptyState
          title="Gallera no encontrada"
          description="La gallera que buscas no existe o ha sido eliminada."
          icon={<Building className="w-12 h-12" />}
          action={
            <button onClick={() => navigate("/venues")} className="btn-primary">
              Volver a Galleras
            </button>
          }
        />
      </div>
    );

  // Entity name (business name - PRINCIPAL)
  const entityName = venue.name || "Gallera sin nombre";

  // Location & Description (transformed by backend)
  const location = venue.location || "Ubicación no especificada";
  const description = venue.description || "Información no disponible";
  const images = venue.images || [];

  // Owner/Representative info (from owner.profileInfo)
  const representativeName =
    venue.owner?.profileInfo?.fullName ||
    venue.owner?.username ||
    "Representante";
  const representativeEmail =
    venue.owner?.profileInfo?.venueEmail || "No especificado";
  const representativePhone =
    venue.owner?.profileInfo?.phoneNumber || "No especificado";
  const website = venue.owner?.profileInfo?.venueWebsite || null;

  // Additional info
  const establishedDate = venue.createdAt;
  const isVerified =
    venue.owner?.profileInfo?.verificationLevel === "full" || false;
  const activeEvents = 0; // This would need to come from events API
  const rating = 0; // This would need to come from ratings API

  const publishedArticles = articles.filter((a) => a.status === "published");
  const draftArticles = articles.filter((a) => a.status === "draft");

  return (
    <div className="page-background pb-24">
      <div className="p-4 space-y-6">
        {/* Back Navigation */}
        <button
          onClick={() => navigate("/venues")}
          className="flex items-center gap-2 text-sm text-theme-light hover:text-theme-primary transition-colors btn-primary !rounded-l-none"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Galleras
        </button>

        {/* Venue Header - Entity Name with Info Chips */}
        <div className="card-background p-6 md:p-8 mb-6">
          {/* Main Entity Name */}
          <h1 className="text-4xl md:text-5xl font-bold text-theme-primary mb-4">
            {entityName}
          </h1>

          {/* Info Chips - Location, Rating, Events, Verificación, Fundada */}
          <div className="flex flex-wrap gap-2">
            {/* Ubicación */}
            <div className="bg-blue-500/30 border border-blue-500 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs text-gray-900 font-medium">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{location}</span>
            </div>

            {/* Rating */}
            {rating > 0 && (
              <div className="bg-yellow-500/30 border border-yellow-500 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs text-gray-900 font-medium">
                <Star className="w-3.5 h-3.5 text-yellow-600" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}

            {/* Eventos */}
            <div className="bg-red-500/30 border border-red-500 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs text-gray-900 font-medium">
              <Zap className="w-3.5 h-3.5 text-red-600" />
              <span>{activeEvents || 0}</span>
            </div>

            {/* Verificación */}
            {isVerified && (
              <div className="bg-amber-500/30 border border-amber-500 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs text-gray-900 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Verificado</span>
              </div>
            )}

            {/* Fundada */}
            <div className="bg-slate-400/30 border border-slate-400 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs text-gray-900 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              <span>
                {establishedDate
                  ? new Date(establishedDate).getFullYear()
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card-background p-6 md:p-8 mb-6">
          <p className="text-theme-light leading-relaxed">{description}</p>
        </div>

        {/* Representative Info Card */}
        <div className="card-background p-6 md:p-8 mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-4 font-semibold">
            Propietario/Representante
          </p>
          <p className="text-2xl font-bold text-theme-primary mb-4">
            {representativeName}
          </p>
          <div className="space-y-3">
            {representativeEmail !== "No especificado" && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">📧</span>
                <a
                  href={`mailto:${representativeEmail}`}
                  className="text-theme-light hover:text-theme-primary transition-colors"
                >
                  {representativeEmail}
                </a>
              </div>
            )}
            {representativePhone !== "No especificado" && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">📞</span>
                <span className="text-theme-light">{representativePhone}</span>
              </div>
            )}
            {website && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">🌐</span>
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-theme-light hover:text-theme-primary transition-colors truncate"
                >
                  {website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Image Carousel - BEFORE articles */}
        {images && images.length > 0 && (
          <div className="mb-6">
            <ImageCarouselViewer
              images={images}
              title="Galería de la Gallera"
            />
          </div>
        )}

        {/* Articles Section - FINAL SECTION */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-theme-primary mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Artículos de la Gallera
          </h2>

          {publishedArticles.length > 0 ? (
            <div className="space-y-4">
              {publishedArticles.map((article) => (
                <div
                  key={article.id}
                  className="p-4 rounded-lg bg-[#1a1f37]/50 hover:bg-[#2a325c]/50 cursor-pointer transition-colors"
                >
                  <h3 className="font-semibold text-theme-primary mb-1">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="text-sm text-theme-light line-clamp-2 mb-2">
                      {article.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-theme-light">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(
                          article.published_at ||
                            article.created_at ||
                            Date.now(),
                        ).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Publicado</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin artículos publicados"
              description={`${entityName} aún no ha publicado artículos.`}
              icon={<BookOpen className="w-10 h-10" />}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default VenueDetailPage;

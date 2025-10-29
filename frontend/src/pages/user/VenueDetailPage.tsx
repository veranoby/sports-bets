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
      setError("No se proporcionó un ID de venue.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const venueResponse = await venuesAPI.getById(id);
        if (!venueResponse.success) {
          throw new Error(venueResponse.error || "Error al cargar venue");
        }
        setVenue(venueResponse.data);

        // ⚡ Optimized: Try ownerId first, then fallback to owner data
        let ownerId = venueResponse.data.ownerId || venueResponse.data.owner?.id;

        // Fallback: If no ownerId, try to find via owner relationship (for compatibility)
        if (!ownerId && venueResponse.data.owner?.id) {
          ownerId = venueResponse.data.owner.id;
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
        setError("No se pudo cargar el local. Inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading)
    return (
      <div className="page-background">
        <LoadingSpinner text="Cargando local..." className="mt-20" />
      </div>
    );

  if (error)
    return (
      <div className="page-background p-4">
        <Card variant="error" className="p-6">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => navigate("/venues")} className="btn-primary">
              Volver a Locales
            </button>
          </div>
        </Card>
      </div>
    );

  if (!venue)
    return (
      <div className="page-background p-4">
        <EmptyState
          title="Local no encontrado"
          description="El local que buscas no existe o ha sido eliminado."
          icon={<Building className="w-12 h-12" />}
          action={
            <button onClick={() => navigate("/venues")} className="btn-primary">
              Volver a Locales
            </button>
          }
        />
      </div>
    );

  const venueName =
    venue.name ||
    venue.owner?.profileInfo?.businessName ||
    venue.owner?.username ||
    "Venue";
  const location = venue.location || "Ubicación no especificada";
  const description = venue.description || "Local para eventos de gallos";
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
          Volver a Locales
        </button>

        {/* Venue Header */}
        <div className="card-background p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {venue.images?.[0] ? (
              <img
                src={venue.images[0]}
                alt={venueName}
                className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border-2 border-blue-500"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Building className="w-8 h-8 md:w-12 md:h-12 text-theme-light/50" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-theme-primary">
                  {venueName}
                </h1>
                {isVerified && <Sparkles className="w-5 h-5 text-yellow-400" />}
              </div>
              <div className="flex items-center gap-2 text-theme-light mb-3">
                <MapPin className="w-4 h-4" />
                <span className="text-base md:text-lg">{location}</span>
              </div>
              <p className="text-theme-light leading-relaxed">{description}</p>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">
                Artículos
              </span>
            </div>
            <span className="text-lg font-bold text-theme-primary">
              {publishedArticles.length}
            </span>
          </Card>

          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-400 font-medium">
                Rating
              </span>
            </div>
            <span className="text-lg font-bold text-theme-primary">
              {rating > 0 ? rating.toFixed(1) : "N/A"}
            </span>
          </Card>

          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                Eventos
              </span>
            </div>
            <span className="text-lg font-bold text-theme-primary">
              {activeEvents}
            </span>
          </Card>

          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">
                Fundado
              </span>
            </div>
            <span className="text-lg font-bold text-theme-primary">
              {establishedDate
                ? new Date(establishedDate).getFullYear()
                : "N/A"}
            </span>
          </Card>
        </div>

        {/* Articles Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-theme-primary mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Artículos del Local
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
              description={`${venueName} aún no ha publicado artículos.`}
              icon={<BookOpen className="w-10 h-10" />}
            />
          )}
        </Card>

        {/* Venue Status Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-theme-primary mb-4">
            Estado del Local
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-theme-light">Estado de verificación:</span>
              <span
                className={`font-medium ${isVerified ? "text-green-600" : "text-amber-600"}`}
              >
                {isVerified ? "Verificado" : "En verificación"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-theme-light">Artículos en borrador:</span>
              <span className="font-medium text-theme-primary">
                {draftArticles.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-theme-light">Miembro desde:</span>
              <span className="font-medium text-theme-primary">
                {new Date(venue.createdAt).toLocaleDateString("es-ES")}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VenueDetailPage;

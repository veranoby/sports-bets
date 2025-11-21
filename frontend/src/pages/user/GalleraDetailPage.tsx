// frontend/src/pages/user/GalleraDetailPage.tsx
// ================================================================
// Dedicated gallera detail page component with premium tiers and specialties

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gallerasAPI, articlesAPI } from "../../services/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import Card from "../../components/shared/Card";
import {
  MapPin,
  ChevronLeft,
  BookOpen,
  Calendar,
  Shield,
  Star,
  Sparkles,
  Crown,
  Award,
  Clock,
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

const GalleraDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [gallera, setGallera] = useState<any | null>(null);
  const [articles, setArticles] = useState<ArticleLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No se proporcionó un ID de criadero.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const galleraResponse = await gallerasAPI.getById(id);
        if (!galleraResponse.success) {
          throw new Error(galleraResponse.error || "Error al cargar criadero");
        }
        const galleraData = galleraResponse.data as any;
        setGallera(galleraData);

        // ⚡ Optimized: Try ownerId first, then fallback to owner data
        let ownerId = galleraData.ownerId || galleraData.owner?.id;

        // Fallback: If no ownerId, try to find via owner relationship (for compatibility)
        if (!ownerId && galleraData.owner?.id) {
          ownerId = galleraData.owner.id;
        }

        if (ownerId) {
          const articlesResponse = await articlesAPI.getAll({
            author_id: ownerId,
          });
          if (articlesResponse.success) {
            setArticles((articlesResponse.data as any)?.articles || []);
          }
        }
      } catch (err) {
        console.error("Error fetching gallera data:", err);
        setError("No se pudo cargar el criadero. Inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getPremiumColor = (level?: string) => {
    switch (level) {
      case "platinum":
        return "text-purple-400 bg-purple-500/20 border-purple-500/50";
      case "gold":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/50";
      case "silver":
        return "text-gray-400 bg-gray-500/20 border-gray-500/50";
      case "bronze":
        return "text-orange-400 bg-orange-500/20 border-orange-500/50";
      default:
        return "text-green-600 bg-green-500/20 border-green-500/50";
    }
  };

  const getPremiumIcon = (level?: string) => {
    switch (level) {
      case "platinum":
      case "gold":
        return <Crown className="w-4 h-4" />;
      case "silver":
      case "bronze":
        return <Award className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  if (loading)
    return (
      <div className="page-background">
        <LoadingSpinner text="Cargando criadero..." className="mt-20" />
      </div>
    );

  if (error)
    return (
      <div className="page-background p-4">
        <Card variant="error" className="p-6">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => navigate("/galleras")}
              className="btn-primary"
            >
              Volver a Criaderos
            </button>
          </div>
        </Card>
      </div>
    );

  if (!gallera)
    return (
      <div className="page-background p-4">
        <EmptyState
          title="Criadero no encontrado"
          description="El criadero que buscas no existe o ha sido eliminada."
          icon={<Shield className="w-12 h-12" />}
          action={
            <button
              onClick={() => navigate("/galleras")}
              className="btn-primary"
            >
              Volver a Criaderos
            </button>
          }
        />
      </div>
    );

  // Entity name (business name - PRINCIPAL)
  const entityName = gallera.name || "Criadero sin nombre";

  // Location & Description (transformed by backend)
  const location = gallera.location || "Ubicación no especificada";
  const description = gallera.description || "Información no disponible";
  const images = gallera.images || [];

  // Owner/Representative info (from owner.profileInfo)
  const representativeName =
    gallera.owner?.profileInfo?.fullName ||
    gallera.owner?.username ||
    "Representante";
  const representativeEmail =
    gallera.owner?.profileInfo?.galleraEmail || "No especificado";
  const representativePhone =
    gallera.owner?.profileInfo?.phoneNumber || "No especificado";
  const website = gallera.owner?.profileInfo?.galleraWebsite || null;

  // Gallera-specific info (from owner.profileInfo)
  const establishedDate = gallera.createdAt;
  const isCertified =
    gallera.owner?.profileInfo?.verificationLevel === "full" || false;
  const rating = gallera.owner?.profileInfo?.rating || 0;
  const premiumLevel = gallera.owner?.profileInfo?.premiumLevel;

  const publishedArticles = articles.filter((a) => a.status === "published");
  const draftArticles = articles.filter((a) => a.status === "draft");

  return (
    <div className="page-background pb-24">
      <div className="p-4 space-y-6">
        {/* Back Navigation */}
        <button
          onClick={() => navigate("/galleras")}
          className="flex items-center gap-2 text-sm text-theme-light hover:text-theme-primary transition-colors btn-primary !rounded-l-none btn-primary !rounded-l-none"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Criaderos
        </button>

        {/* Gallera Header - Entity Name with Info Chips */}
        <div className="card-background p-6 md:p-8 mb-6">
          {/* Main Entity Name */}
          <h1 className="text-4xl md:text-5xl font-bold text-theme-primary mb-4">
            {entityName}
          </h1>

          {/* Info Chips - Location, Rating, Gallos, Verificación, Nivel, Fundada */}
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

            {/* Verificación */}
            {isCertified && (
              <div className="bg-amber-500/30 border border-amber-500 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs text-gray-900 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Certificado</span>
              </div>
            )}

            {/* Nivel Premium */}
            {premiumLevel && (
              <div
                className={`rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium border text-gray-900 ${getPremiumColor(premiumLevel)}`}
              >
                {getPremiumIcon(premiumLevel)}
                <span>{premiumLevel.toUpperCase()}</span>
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

        {/* Representative Info Card - OVER images and articles */}
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
            <ImageCarouselViewer images={images} title="Galería del Criadero" />
          </div>
        )}

        {/* Articles Section - FINAL SECTION */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-theme-primary mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Artículos del Criadero
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
              description={`${entityName} aún no ha publicado artículos especializados.`}
              icon={<BookOpen className="w-10 h-10" />}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default GalleraDetailPage;

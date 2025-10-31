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
      setError("No se proporcionó un ID de institución.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const galleraResponse = await gallerasAPI.getById(id);
        if (!galleraResponse.success) {
          throw new Error(
            galleraResponse.error || "Error al cargar institución",
          );
        }
        const galleraData = galleraResponse.data as any;
        setGallera(galleraData);

        // ⚡ Optimized: Try ownerId first, then fallback to owner data
        let ownerId =
          galleraData.ownerId || galleraData.owner?.id;

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
        setError("No se pudo cargar la institución. Inténtalo de nuevo.");
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
        <LoadingSpinner text="Cargando institución..." className="mt-20" />
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
              Volver a Instituciones
            </button>
          </div>
        </Card>
      </div>
    );

  if (!gallera)
    return (
      <div className="page-background p-4">
        <EmptyState
          title="Institución no encontrada"
          description="La institución que buscas no existe o ha sido eliminada."
          icon={<Shield className="w-12 h-12" />}
          action={
            <button
              onClick={() => navigate("/galleras")}
              className="btn-primary"
            >
              Volver a Instituciones
            </button>
          }
        />
      </div>
    );

  const galleraName =
    gallera.name ||
    gallera.owner?.profileInfo?.galleraName ||
    gallera.owner?.username ||
    "Gallera";
  const location = gallera.location || "Ubicación no especificada";
  const description = gallera.description || "Institución criadora profesional";
  const establishedDate = gallera.createdAt;
  const isCertified =
    gallera.owner?.profileInfo?.verificationLevel === "full" || false;
  const rating = gallera.owner?.profileInfo?.rating || 0;
  const premiumLevel = gallera.owner?.profileInfo?.premiumLevel;
  // ⚡ Fixed: specialties puede ser string[] o {breeds, trainingMethods, experience}
  const specialties = Array.isArray(gallera.specialties)
    ? gallera.specialties
    : gallera.specialties?.breeds || [];

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
          Volver a Instituciones
        </button>

        {/* Gallera Header */}
        <div className="card-background p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {gallera.images?.[0] ? (
              <img
                src={gallera.images[0]}
                alt={galleraName}
                className={`w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border-2 ${
                  premiumLevel
                    ? getPremiumColor(premiumLevel).split(" ")[2]
                    : "border-green-500"
                }`}
              />
            ) : (
              <div
                className={`w-24 h-24 md:w-32 md:h-32 rounded-lg bg-gradient-to-br ${
                  premiumLevel
                    ? getPremiumColor(premiumLevel)
                    : "from-green-500/20 to-teal-500/20"
                } flex items-center justify-center`}
              >
                <Shield className="w-8 h-8 md:w-12 md:h-12 text-theme-light/50" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-theme-primary">
                  {galleraName}
                </h1>
                {isCertified && (
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                )}
                {premiumLevel && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPremiumColor(premiumLevel)}`}
                  >
                    {getPremiumIcon(premiumLevel)}
                    {premiumLevel.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-theme-light mb-3">
                <MapPin className="w-4 h-4" />
                <span className="text-base md:text-lg">{location}</span>
              </div>
              <p className="text-theme-light leading-relaxed mb-3">
                {description}
              </p>

              {/* Specialties */}
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="bg-blue-500/20 text-blue-600 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Image Carousel */}
          {gallera.images && gallera.images.length > 0 && (
            <ImageCarouselViewer
              images={gallera.images}
              title="Galería de la Institución"
            />
          )}
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
              <Award className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">Nivel</span>
            </div>
            <span className="text-lg font-bold text-theme-primary capitalize">
              {premiumLevel || "Estándar"}
            </span>
          </Card>

          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                Fundada
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
            Artículos y Conocimientos
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
              description={`${galleraName} aún no ha publicado artículos especializados.`}
              icon={<BookOpen className="w-10 h-10" />}
            />
          )}
        </Card>

        {/* Institution Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-theme-primary mb-4">
            Información de la Institución
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-theme-light">Estado de certificación:</span>
              <span
                className={`font-medium ${isCertified ? "text-green-600" : "text-amber-600"}`}
              >
                {isCertified ? "Certificada" : "En certificación"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-theme-light">Especialidades:</span>
              <span className="font-medium text-theme-primary">
                {specialties.length > 0
                  ? specialties.length
                  : "No especificadas"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-theme-light">Artículos en borrador:</span>
              <span className="font-medium text-theme-primary">
                {draftArticles.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-theme-light">Experiencia:</span>
              <span className="font-medium text-theme-primary">
                {establishedDate
                  ? `${new Date().getFullYear() - new Date(establishedDate).getFullYear()} años`
                  : "No especificada"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-theme-light">Miembro desde:</span>
              <span className="font-medium text-theme-primary">
                {gallera.createdAt
                  ? new Date(gallera.createdAt).toLocaleDateString("es-ES")
                  : "No especificado"}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GalleraDetailPage;

// frontend/src/pages/user/VenueDetailPage.tsx
// ================================================================
// Dedicated venue detail page component with proper venue-specific features

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import type { Venue as VenueEntity, User } from "../../types";

interface ArticleLite {
  id: string;
  title: string;
  summary?: string;
  createdAt?: string;
  created_at?: string;
  status: string;
  published_at?: string;
  featured_image?: string;
  featured_image_url?: string;
}

type VenueWithOwner = VenueEntity & {
  owner?: User;
  ownerId?: string;
};

const VenueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<VenueWithOwner | null>(null);
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
        const venueData = venueResponse.data as VenueWithOwner;
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
  const ownerProfileImage = venue.owner?.profileInfo?.imageUrl;

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
  const heroImage = images[0] || ownerProfileImage;

  const statChips = [
    {
      label: location,
      icon: <MapPin className="w-4 h-4" />,
    },
    rating > 0
      ? {
          label: `${rating.toFixed(1)} rating`,
          icon: <Star className="w-4 h-4" />,
        }
      : null,
    activeEvents
      ? {
          label: `${activeEvents} eventos activos`,
          icon: <Zap className="w-4 h-4" />,
        }
      : null,
    isVerified
      ? {
          label: "Verificado",
          icon: <Sparkles className="w-4 h-4" />,
        }
      : null,
    {
      label: establishedDate
        ? `Desde ${new Date(establishedDate).getFullYear()}`
        : "Fundación N/D",
      icon: <Calendar className="w-4 h-4" />,
    },
  ].filter(Boolean) as { label: string; icon: React.ReactNode }[];

  return (
    <div className="page-background pb-24">
      <div className="p-4 space-y-8">
        <button
          onClick={() => navigate("/venues")}
          className="inline-flex items-center gap-2 text-sm text-theme-light hover:text-theme-primary transition-colors rounded-full px-4 py-2 bg-white/90 shadow-sm border border-gray-200"
        >
          <ChevronLeft className="w-4 h-4" /> Volver a Galleras
        </button>

        {/* Hero */}
        <section className="relative rounded-3xl overflow-hidden shadow-2xl">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: heroImage
                ? `linear-gradient(120deg, rgba(5,7,15,0.85), rgba(5,7,15,0.45)), url(${heroImage})`
                : "linear-gradient(135deg, #1f1d42, #2a325c)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="relative z-10 p-6 md:p-10 text-white space-y-6">
            <div className="flex items-center gap-4">
              {ownerProfileImage && (
                <img
                  src={ownerProfileImage}
                  alt={entityName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/40 shadow-lg"
                />
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/70 mb-2">
                  Gallera destacada
                </p>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                  {entityName}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {statChips.map((chip, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-white/25 bg-white/15"
                >
                  {chip.icon}
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Description + Contact */}
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="card-background p-6 md:p-8">
            <h2 className="text-xl font-semibold text-theme-primary mb-4">
              Sobre la gallera
            </h2>
            <p className="text-theme-light leading-relaxed">{description}</p>
          </div>
          <div className="card-background p-6 space-y-4">
            <h3 className="text-lg font-semibold text-theme-primary">
              Contacto directo
            </h3>
            <div className="space-y-3 text-sm text-theme-light">
              {representativeEmail !== "No especificado" && (
                <a
                  href={`mailto:${representativeEmail}`}
                  className="flex items-center gap-2 hover:text-theme-primary"
                >
                  <Mail className="w-4 h-4" /> {representativeEmail}
                </a>
              )}
              {representativePhone !== "No especificado" && (
                <a
                  href={`tel:${representativePhone}`}
                  className="flex items-center gap-2 hover:text-theme-primary"
                >
                  <Phone className="w-4 h-4" /> {representativePhone}
                </a>
              )}
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-theme-primary truncate"
                >
                  <Globe className="w-4 h-4" /> {website}
                </a>
              )}
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-theme-light mb-2">
                Representante
              </p>
              <p className="text-lg font-semibold text-theme-primary">
                {representativeName}
              </p>
            </div>
          </div>
        </section>

        {/* Gallery */}
        {images && images.length > 0 && (
          <section className="card-background p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-theme-primary">
                Galería
              </h2>
              <span className="text-sm text-theme-light">
                Recomendado: formato horizontal 16:9
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {images.slice(0, 2).map((img, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl overflow-hidden aspect-video group"
                >
                  <img
                    src={img}
                    alt={`${entityName}-galeria-${idx}`}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              ))}
              {images.slice(2).length > 0 && (
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  {images.slice(2).map((img, idx) => (
                    <div
                      key={`extra-${idx}`}
                      className="relative rounded-xl overflow-hidden aspect-video"
                    >
                      <img
                        src={img}
                        alt={`${entityName}-extra-${idx}`}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Articles */}
        <section className="card-background p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-theme-primary flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> Artículos de la
              gallera
            </h2>
            <span className="text-sm text-theme-light">
              {publishedArticles.length} publicados · {draftArticles.length}{" "}
              borradores
            </span>
          </div>

          {publishedArticles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {publishedArticles.map((article) => {
                const thumbnail =
                  article.featured_image || article.featured_image_url;

                return (
                  <Link
                    key={article.id}
                    to={`/article/${article.id}`}
                    className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur hover:border-white/30 transition block"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-white/10 border border-white/20 flex items-center justify-center">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="w-6 h-6 text-white/60" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-theme-primary mb-1">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="text-sm text-theme-light line-clamp-2 mb-3">
                            {article.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-theme-light">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(
                              article.published_at ||
                                article.created_at ||
                                Date.now(),
                            ).toLocaleDateString("es-ES")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Publicado
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Sin artículos publicados"
              description={`${entityName} aún no ha publicado artículos.`}
              icon={<BookOpen className="w-10 h-10" />}
            />
          )}
        </section>
      </div>
    </div>
  );
};
export default VenueDetailPage;

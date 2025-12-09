// frontend/src/pages/user/ArticlePage.tsx - Ver artículo específico
// ================================================================

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Calendar,
  User,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { apiClient } from "../../config/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Card from "../../components/shared/Card";
import EmptyState from "../../components/shared/EmptyState";
import SubscriptionGuard from "../../components/shared/SubscriptionGuard";

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  author_name?: string;
  venue_name?: string;
  published_at: string;
  featured_image_url?: string;
}

const professionalGradients = [
  "linear-gradient(135deg, #596c95 0%, #4a5568 100%)",
  "linear-gradient(135deg, #596c95 0%, #2d3748 100%)",
  "linear-gradient(135deg, #596c95 0%, #1a202c 100%)",
  "linear-gradient(135deg, #596c95 0%, #4c51bf 100%)",
  "linear-gradient(135deg, #596c95 0%, #553c9a 100%)",
  "linear-gradient(135deg, #596c95 0%, #2b6cb0 100%)",
  "linear-gradient(135deg, #596c95 0%, #2c5282 100%)",
  "linear-gradient(135deg, #596c95 0%, #2d5016 100%)",
];

const getGradientForArticle = (articleId?: string) => {
  if (!articleId) return professionalGradients[0];
  const hash = articleId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return professionalGradients[hash % professionalGradients.length];
};

const estimateReadingTime = (html: string) => {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const ArticlePage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();

  // Reutilizar patrón existente
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await apiClient.get(`/articles/${articleId}`);
          setArticle(response.data);
        } catch (err: unknown) {
          let errorMessage = "Error al cargar artículo";
          if (err instanceof Error) {
            errorMessage = err.message;
          }
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      };
      fetchArticle();
    }
  }, [articleId]);

  if (loading) return <LoadingSpinner text="Cargando artículo..." />;

  if (error || !article) {
    return (
      <div className="p-4">
        <EmptyState
          title="Artículo no encontrado"
          description="Este artículo no existe o ha sido eliminado"
          icon={<Calendar className="w-12 h-12" />}
        />
      </div>
    );
  }

  const articleGradient = getGradientForArticle(article.id);
  const hasFeaturedImage = Boolean(article.featured_image_url);
  const formattedDate = new Date(article.published_at).toLocaleDateString(
    "es-EC",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );
  const readingTime = estimateReadingTime(article.content);

  return (
    <SubscriptionGuard feature="artículos premium">
      <div className="space-y-6 p-4 md:p-6">
        {/* Botón volver */}
        <button
          onClick={() => navigate("/news")}
          className="inline-flex items-center gap-2 text-sm text-theme-light hover:text-theme-primary transition-all rounded-full px-4 py-2 bg-white shadow-sm border border-gray-200 hover:shadow-md"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Noticias
        </button>

        {/* Hero inmersivo */}
        <section className="relative min-h-[360px] rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{ backgroundImage: articleGradient }}
            />

            {hasFeaturedImage && (
              <>
                <div className="absolute inset-0">
                  <div
                    className="absolute inset-[-25%] scale-110 blur-3xl opacity-70"
                    style={{
                      backgroundImage: `url(${article.featured_image_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={article.featured_image_url}
                    alt={article.title}
                    className="h-full w-auto max-w-none object-cover drop-shadow-[0_25px_45px_rgba(5,7,15,0.4)]"
                    loading="lazy"
                  />
                </div>
              </>
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/20" />

          <div className="relative z-10 flex flex-col gap-6 p-6 md:p-10 lg:p-14 text-white">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-white/70">
              <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20">
                {formattedDate}
              </span>
              {article.author_name && (
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {article.author_name}
                </span>
              )}
              {article.venue_name && (
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {article.venue_name}
                </span>
              )}
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {readingTime} min de lectura
              </span>
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-2">
                Artículo destacado
              </p>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                {article.title}
              </h1>
            </div>

            {article.summary && (
              <div className="bg-white/15 border border-white/20 rounded-2xl p-4 md:p-5 backdrop-blur">
                <div className="flex items-start gap-3 text-white/90">
                  <Sparkles className="w-5 h-5 mt-1 text-yellow-200" />
                  <p className="text-base md:text-lg italic">
                    <span dangerouslySetInnerHTML={{ __html: article.summary }} />
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Contenido principal */}
        <Card className="p-6 md:p-8 lg:p-10 shadow-xl border border-gray-100 bg-white/95 backdrop-blur">
          <div className="prose max-w-none prose-headings:text-theme-primary prose-p:text-gray-700">
            <div
              className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </Card>
      </div>
    </SubscriptionGuard>
  );
};
export default ArticlePage;

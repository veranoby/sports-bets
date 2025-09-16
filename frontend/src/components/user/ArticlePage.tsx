// frontend/src/pages/user/ArticlePage.tsx - Ver artículo específico
// ================================================================

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Calendar, User, MapPin } from "lucide-react";
import { apiClient } from "../../config/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Card from "../../components/shared/Card";
import EmptyState from "../../components/shared/EmptyState";

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

const ArticlePage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();

  // Reutilizar patrón existente
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    // This is a placeholder for the actual execute function
    // In a real implementation, this would contain the logic to fetch the article
  };

  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await apiClient.get(`/articles/${articleId}`);
          setArticle(response.data);
        } catch (err: any) {
          setError(err.message || "Error al cargar artículo");
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

  return (
    <div className="space-y-4 p-4">
      {/* Botón volver */}
      <button
        onClick={() => navigate("/news")}
        className="flex items-center gap-2 text-sm text-theme-light hover:text-theme-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver a Noticias
      </button>

      {/* Artículo */}
      <Card className="p-6">
        {/* Imagen featured */}
        {article.featured_image_url && (
          <div className="w-full h-64 mb-6 rounded-lg overflow-hidden bg-gray-700">
            <img
              src={article.featured_image_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-theme-primary mb-3">
            {article.title}
          </h1>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-theme-light">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(article.published_at).toLocaleDateString("es-EC", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            {article.author_name && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{article.author_name}</span>
              </div>
            )}

            {article.venue_name && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{article.venue_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 p-4 bg-[#1a1f37]/30 rounded-lg border-l-4 border-red-500">
          <p className="text-theme-light italic">{article.summary}</p>
        </div>

        {/* Contenido */}
        <div className="prose prose-invert max-w-none">
          <div
            className="text-theme-light leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </Card>
    </div>
  );
};

export default ArticlePage;

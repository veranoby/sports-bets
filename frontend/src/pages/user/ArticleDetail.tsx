import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Article } from "../../types";
import { apiClient } from "../../config/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/articles/${id}`);
        setArticle(response.data.data);
      } catch (err: unknown) {
        // Changed from 'any' to 'unknown' for better type safety
        setError(
          (err as any)?.response?.data?.message ||
            (err as Error)?.message ||
            "Error al cargar el artículo",
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!article) return <ErrorMessage message="Artículo no encontrado" />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Navigation */}
      <div className="mb-6">
        <Link
          to="/user/articles"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a artículos
        </Link>
      </div>

      {/* Article Content */}
      <article className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Featured Image */}
        {article.featured_image_url && (
          <div className="w-full h-64 md:h-80">
            <img
              src={article.featured_image_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 md:p-8">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center text-sm text-gray-600 mb-6 space-x-4">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              <span>{article.author_name || "Autor"}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>
                {new Date(article.created_at).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            {article.category && (
              <div className="flex items-center">
                <Tag className="w-4 h-4 mr-1" />
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {article.category}
                </span>
              </div>
            )}
          </div>

          {/* Summary */}
          {article.summary && (
            <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-gray-800 italic">{article.summary}</p>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div
              className="text-gray-900 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: article.content.replace(/\n/g, "<br>"),
              }}
            />
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Etiquetas
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Venue Association */}
          {article.venue && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Gallera Asociada
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900">
                  {article.venue.name}
                </h4>
                {article.venue.location && (
                  <p className="text-blue-700 text-sm mt-1">
                    {article.venue.location}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Related Articles */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Artículos Relacionados
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for related articles */}
          <div className="bg-gray-100 rounded-lg p-6 text-center">
            <p className="text-gray-600">Artículos relacionados próximamente</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;

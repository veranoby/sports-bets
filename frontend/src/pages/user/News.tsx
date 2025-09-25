// frontend/src/pages/user/News.tsx - EFICIENTE Y REUTILIZADA
// ================================================================
// Server-side filtering para eficiencia de costos

import React, { useState, useEffect } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { articlesAPI } from "../../services/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import Card from "../../components/shared/Card";
import NewsBanner from "../../components/shared/NewsBanner";
import SearchInput from "../../components/shared/SearchInput";
import ArticleManagement from "../../components/articles/ArticleManagement";
import type { Article } from "../../types/article";



const NewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Added auth hook
  const [search, setSearch] = useState("");
  const venueFilter = "";
  const [page, setPage] = useState(1);

  // ✅ Estados locales para artículos y paginación
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch optimizado
  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await articlesAPI.getAll({
        search,
        venueId: venueFilter,
        page,
        limit: 10,
        status: "published",
      });
      if (response.success) {
        setArticles((response.data as any)?.articles || []);
        setTotalPages((response.data as any)?.totalPages || 1);
      } else {
        setError(response.error || "Error al cargar artículos");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar artículos",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, venueFilter, page]);

  if (loading) return <LoadingSpinner text="Cargando noticias..." />;

  return (
    <div className="page-background space-y-4 p-4">
      {/* Reutilizar NewsBanner existente */}
      <NewsBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3 of the page) - Search and article viewing sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filtros Estandarizados */}
          <Card className="p-4">
            <SearchInput
              placeholder="Buscar noticias..."
              onSearch={(value) => setSearch(value)}
              value={search}
              showClearButton
              debounceMs={300}
              className="w-full"
            />
          </Card>

          {/* Lista optimizada */}
          {error ? (
            <Card variant="error">{error}</Card>
          ) : !articles.length ? (
            <EmptyState
              title="No hay noticias"
              icon={<Calendar className="w-12 h-12" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => navigate(`/news/${article.id}`)}
                  className="card-background p-4 cursor-pointer hover:bg-[#2a325c]/80 transition-all duration-200 transform hover:scale-[1.02] flex flex-col justify-between h-80"
                >
                  {/* Article Image */}
                  {article.featured_image_url ? (
                    <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
                      <img
                        src={article.featured_image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-r from-[#596c95] to-[#cd6263] rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-white/80 text-sm">Sin imagen</span>
                    </div>
                  )}

                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">
                        Publicado
                      </span>
                      <span className="text-xs text-theme-light">
                        {new Date(article.published_at).toLocaleDateString(
                          "es-ES",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <h2 className="font-semibold text-theme-primary text-lg line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-sm text-theme-light mt-1 line-clamp-3">
                      {article.summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#596c95]/20">
                    <div className="text-xs text-theme-light truncate">
                      {article.author_name && (
                        <span>Por: {article.author_name}</span>
                      )}
                      {article.venue_name && (
                        <span className="ml-2">• {article.venue_name}</span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-theme-light flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación simple */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-[#1a1f37]/50 rounded text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-[#1a1f37]/50 rounded text-sm disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Right column (1/3 of the page) - ArticleManagement component */}
        {(user?.role === "venue" || user?.role === "gallera") && (
          <div className="lg:col-span-1">
            <ArticleManagement />
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;

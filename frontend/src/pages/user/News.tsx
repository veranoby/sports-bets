// frontend/src/pages/user/News.tsx - EFICIENTE Y REUTILIZADA
// ================================================================
// Server-side filtering para eficiencia de costos

import React, { useState, useEffect } from "react";
import { Search, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../config/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import Card from "../../components/shared/Card";
import NewsBanner from "../../components/shared/NewsBanner";

interface Article {
  id: string;
  title: string;
  summary: string;
  published_at: string;
  author_name?: string;
  venue_name?: string;
}

const NewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [venueFilter, setVenueFilter] = useState("");
  const [page, setPage] = useState(1);

  // ✅ Estados locales para artículos y paginación
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch optimizado
  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/articles", {
        params: {
          search,
          venueId: venueFilter,
          page,
          limit: 10,
          status: "published",
        },
      });
      setArticles(response.data.articles || []);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (err: any) {
      setError(err?.message || "Error al cargar noticias");
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
    <div className="space-y-4 p-4">
      {/* Reutilizar NewsBanner existente */}
      <NewsBanner />

      {/* Filtros minimalistas */}
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-light" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1a1f37]/50 border border-gray-600/50 rounded-lg text-theme-primary"
            />
          </div>
        </div>
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
        <div className="space-y-3">
          {articles.map((article) => (
            <Card
              key={article.id}
              onClick={() => navigate(`/news/${article.id}`)}
              className="p-4 cursor-pointer hover:bg-[#2a325c]/50"
            >
              <h2 className="font-semibold text-theme-primary">
                {article.title}
              </h2>
              <p className="text-sm text-theme-light mt-1">{article.summary}</p>
              <div className="text-xs text-theme-light mt-2">
                {new Date(article.published_at).toLocaleDateString("es-EC")}
                {article.venue_name && ` • ${article.venue_name}`}
              </div>
            </Card>
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
  );
};

export default NewsPage;

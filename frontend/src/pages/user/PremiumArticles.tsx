// frontend/src/pages/user/PremiumArticles.tsx
// Página de artículos premium con enfoque en contenido exclusivo

import React, { useState, useEffect, useCallback } from "react";
import { Crown, Zap, BookOpen } from "lucide-react";
import { articlesAPI } from "../../services/api";
import PremiumArticleCard from "../../components/articles/PremiumArticleCard";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import { useAuth } from "../../contexts/AuthContext";
import type { Article } from "../../types/article";

type SortBy = "newest" | "popular" | "premium";
type FilterBy = "all" | "premium" | "free";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isArticle = (value: unknown): value is Article =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.content === "string" &&
  typeof value.status === "string" &&
  typeof value.created_at === "string";

const extractArticles = (payload: unknown): Article[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isArticle);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const { articles } = payload;
  if (Array.isArray(articles)) {
    return articles.filter(isArticle);
  }

  if (isArticle(payload)) {
    return [payload];
  }

  return [];
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (isRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  return "Error desconocido al cargar artículos";
};

const sortOptions: SortBy[] = ["newest", "popular", "premium"];
const isSortOption = (value: string): value is SortBy =>
  sortOptions.includes(value as SortBy);

const PremiumArticles: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("premium");
  const [filterBy, setFilterBy] = useState<FilterBy>("all");

  const isPremiumUser =
    user?.subscription?.status === "active" &&
    user.subscription.type !== "free";

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch articles with author information
      const response = await articlesAPI.getAll({
        status: "published",
        limit: 50,
        sortBy: sortBy === "popular" ? "views" : "created_at",
        order: sortBy === "newest" ? "desc" : "asc",
        includeAuthor: true,
      });

      if (response.success) {
        const allArticles = extractArticles(response.data);

        // Filter articles based on premium/free criteria
        let filteredArticles = allArticles;
        if (filterBy === "premium") {
          filteredArticles = allArticles.filter(
            (article) =>
              article.author?.subscription?.status === "active" &&
              article.author.subscription.type !== "free",
          );
        } else if (filterBy === "free") {
          filteredArticles = allArticles.filter(
            (article) =>
              !article.author?.subscription ||
              article.author.subscription.status !== "active" ||
              article.author.subscription.type === "free",
          );
        }

        setArticles(filteredArticles);
      } else {
        throw new Error(response.error || "Error al cargar artículos");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [sortBy, filterBy]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Get premium articles for featured section
  const premiumArticles = articles.filter(
    (article) =>
      article.author?.subscription?.status === "active" &&
      article.author.subscription.type !== "free",
  );

  // Get regular articles
  const regularArticles = articles.filter(
    (article) =>
      !article.author?.subscription ||
      article.author.subscription.status !== "active" ||
      article.author.subscription.type === "free",
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner text="Cargando artículos premium..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage error={error} onRetry={fetchArticles} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Crown className="w-8 h-8 text-yellow-500" />
                Artículos Premium
              </h1>
              <p className="text-gray-600 mt-2">
                Contenido exclusivo de miembros premium
              </p>
            </div>

            {isPremiumUser && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold">
                <Crown className="w-4 h-4" />
                ERES MIEMBRO PREMIUM
              </div>
            )}
          </div>

          {/* Filters and Sorting */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilterBy("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterBy === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todos ({articles.length})
              </button>
              <button
                onClick={() => setFilterBy("premium")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filterBy === "premium"
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Crown className="w-4 h-4" />
                Premium ({premiumArticles.length})
              </button>
              <button
                onClick={() => setFilterBy("free")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterBy === "free"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Gratuitos ({regularArticles.length})
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  if (isSortOption(e.target.value)) {
                    setSortBy(e.target.value);
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="premium">Más Recientes Premium</option>
                <option value="newest">Más Recientes</option>
                <option value="popular">Más Populares</option>
              </select>
            </div>
          </div>
        </div>

        {/* Featured Premium Section */}
        {filterBy !== "free" && premiumArticles.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-4 py-2 rounded-full">
                <Zap className="w-5 h-5" />
                <span className="font-bold">DESTACADOS PREMIUM</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-yellow-300 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {premiumArticles.slice(0, 3).map((article) => (
                <PremiumArticleCard
                  key={article.id}
                  article={article}
                  isPremiumAuthor={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Articles Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            {filterBy === "premium"
              ? "Todos los Artículos Premium"
              : filterBy === "free"
                ? "Artículos Gratuitos"
                : "Todos los Artículos"}
          </h2>

          {articles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay artículos disponibles
              </h3>
              <p className="text-gray-500">
                {filterBy === "premium"
                  ? "No hay artículos premium publicados en este momento."
                  : filterBy === "free"
                    ? "No hay artículos gratuitos publicados en este momento."
                    : "No hay artículos publicados en este momento."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles.map((article) => (
                <PremiumArticleCard
                  key={article.id}
                  article={article}
                  isPremiumAuthor={
                    article.author?.subscription?.status === "active" &&
                    article.author.subscription.type !== "free"
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Premium CTA for free users */}
        {!isPremiumUser && articles.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-8 text-center">
            <Crown className="w-16 h-16 text-black mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-black mb-2">
              ¡Únete a los Artículos Premium!
            </h3>
            <p className="text-black/80 mb-6 max-w-2xl mx-auto">
              Miles de artículos exclusivos de nuestros miembros premium. Accede
              a contenido avanzado, tutoriales profesionales y análisis
              detallados.
            </p>
            <button
              onClick={() => (window.location.href = "/profile")}
              className="bg-black text-yellow-400 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-900 transition-colors shadow-lg transform hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <Crown className="w-5 h-5" />
              Convertirse en Premium
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumArticles;

import React, { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { articlesAPI } from "../../services/api";
// import type { Article } from "../../types/article"; // Not used in this component

interface BannerArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  published_at?: string;
  created_at?: string;
  featured_image?: string;
  featured_image_url?: string;
}

// Professional gradient combinations (blue primary + sophisticated tones)
const professionalGradients = [
  "linear-gradient(135deg, #596c95 0%, #4a5568 100%)", // blue to dark gray
  "linear-gradient(135deg, #596c95 0%, #2d3748 100%)", // blue to charcoal
  "linear-gradient(135deg, #596c95 0%, #1a202c 100%)", // blue to dark
  "linear-gradient(135deg, #596c95 0%, #4c51bf 100%)", // blue to indigo
  "linear-gradient(135deg, #596c95 0%, #553c9a 100%)", // blue to purple
  "linear-gradient(135deg, #596c95 0%, #2b6cb0 100%)", // blue to light blue
  "linear-gradient(135deg, #596c95 0%, #2c5282 100%)", // blue to teal
  "linear-gradient(135deg, #596c95 0%, #2d5016 100%)", // blue to dark green
];

// Fallback news for when API is not available or no featured articles exist
const fallbackNews: BannerArticle[] = [
  {
    id: "fallback-1",
    title: "¡Bienvenido a Galleros.Net!",
    content: "Disfruta de la mejor experiencia de apuestas en vivo.",
    published_at: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    title: "Apuestas seguras y confiables",
    content: "Tu seguridad es nuestra prioridad número uno.",
    published_at: new Date().toISOString(),
  },
];

const NewsBanner: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [news, setNews] = useState<BannerArticle[]>(fallbackNews);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch latest published articles
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        // Fetch latest 5 published articles
        const response = await articlesAPI.getAll({
          status: "published",
          limit: 5,
        });

        const responseData = response.data as {
          articles: Array<{
            id: string;
            title: string;
            summary?: string;
            excerpt?: string;
            content: string;
            published_at?: string;
            created_at?: string;
            featured_image_url?: string;
            featured_image?: string;
          }>;
        };

        if (
          responseData?.articles &&
          Array.isArray(responseData.articles) &&
          responseData.articles.length > 0
        ) {
          const articles = responseData.articles.map(
            (article: {
              id: string;
              title: string;
              summary?: string;
              excerpt?: string;
              content: string;
              published_at?: string;
              created_at?: string;
              featured_image_url?: string;
              featured_image?: string;
            }) => ({
              id: article.id,
              title: article.title,
              content: article.summary || article.excerpt || article.content,
              published_at: article.published_at || article.created_at,
              featured_image:
                article.featured_image_url || article.featured_image,
            }),
          );
          setNews(articles);
        } else {
          // No published articles, use fallback
          setNews(fallbackNews);
        }
      } catch (err: unknown) {
        console.warn("Failed to fetch featured news, using fallback:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        setNews(fallbackNews);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleTransition = useCallback(
    (direction: "prev" | "next") => {
      setIsTransitioning(true);
      setTimeout(() => {
        if (direction === "next") {
          setCurrent((prev) => (prev + 1) % news.length);
        } else {
          setCurrent((prev) => (prev - 1 + news.length) % news.length);
        }
        setIsTransitioning(false);
      }, 300);
    },
    [news.length],
  );

  // Auto-advance carousel with transition
  useEffect(() => {
    const timer = setInterval(() => {
      handleTransition("next");
    }, 5000);
    return () => clearInterval(timer);
  }, [handleTransition]);

  const goPrev = () => handleTransition("prev");
  const goNext = () => handleTransition("next");

  const currentNews = news[current];

  // Get random gradient for current article (deterministic based on article id)
  const getGradientForArticle = (articleId: string) => {
    const hash = articleId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return professionalGradients[hash % professionalGradients.length];
  };

  // Get category badge based on content
  const getCategoryBadge = (title: string, content: string) => {
    const text = (title + " " + content).toLowerCase();
    if (
      text.includes("evento") ||
      text.includes("pelea") ||
      text.includes("gallera")
    ) {
      return {
        label: "Eventos",
        color: "bg-blue-500/20 text-blue-200 border-blue-500/30",
      };
    }
    if (
      text.includes("promo") ||
      text.includes("descuento") ||
      text.includes("oferta")
    ) {
      return {
        label: "Promociones",
        color: "bg-green-500/20 text-green-200 border-green-500/30",
      };
    }
    if (
      text.includes("noticia") ||
      text.includes("actualización") ||
      text.includes("información")
    ) {
      return {
        label: "Noticias",
        color: "bg-purple-500/20 text-purple-200 border-purple-500/30",
      };
    }
    return {
      label: "General",
      color: "bg-gray-500/20 text-gray-200 border-gray-500/30",
    };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString();
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Hoy";
    if (diffDays === 2) return "Ayer";
    if (diffDays <= 7) return `Hace ${diffDays - 1} días`;

    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        className={`bg-gradient-to-r from-[#596c95] to-[#4a5568] rounded-xl shadow-lg p-6 flex items-center gap-4 h-[350px] ${className}`}
      >
        <Megaphone className="w-8 h-8 text-white flex-shrink-0 animate-pulse" />
        <div className="flex-1">
          <div className="bg-white/20 h-6 rounded mb-3 animate-pulse"></div>
          <div className="bg-white/15 h-4 rounded mb-2 animate-pulse"></div>
          <div className="bg-white/10 h-4 rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const categoryBadge = getCategoryBadge(
    currentNews.title,
    currentNews.content,
  );

  return (
    <div
      className={`relative rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${className}`}
      style={{
        height: "350px",
      }}
    >
      {/* Background Layer - with fade transition */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
        style={{
          backgroundImage: currentNews.featured_image
            ? `url(${currentNews.featured_image})`
            : getGradientForArticle(currentNews.id),
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20"></div>

      {/* Content - with slide and fade transition */}
      <div
        className={`relative z-10 h-full flex flex-col justify-center p-6 md:p-8 transition-all duration-500 transform ${
          isTransitioning
            ? "opacity-0 translate-x-4"
            : "opacity-100 translate-x-0"
        }`}
      >
        {/* Header with category badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-white flex-shrink-0" />
            <span className="text-white/90 text-sm font-medium">
              Últimas Noticias
            </span>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryBadge.color}`}
          >
            {categoryBadge.label}
          </div>
        </div>

        {/* Title */}
        <div className="text-white font-bold text-2xl md:text-3xl mb-4 line-clamp-2 leading-tight">
          {currentNews.title}
        </div>

        {/* Content */}
        <div className="text-white/90 text-base md:text-lg mb-6 line-clamp-3 leading-relaxed">
          {currentNews.content}
        </div>

        {/* Footer with date and CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80 font-medium">
              {formatDate(currentNews.published_at)}
            </span>
            {error && (
              <span className="flex items-center gap-1 text-yellow-200 text-sm">
                <AlertCircle className="w-4 h-4" />
                API offline
              </span>
            )}
          </div>

          {/* Call to Action */}
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm border border-white/20 hover:scale-105">
            Leer más
          </button>
        </div>
      </div>

      {/* Enhanced Navigation Controls - Bottom Row */}
      {news.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-50 flex items-center justify-between px-6">
          {/* Left Arrow */}
          <button
            onClick={goPrev}
            className="p-2 text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full transition-all duration-200 hover:scale-110 shadow-lg border border-white/20"
            aria-label="Artículo anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots Indicator - Center */}
          <div className="flex gap-2">
            {news.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrent(index);
                    setIsTransitioning(false);
                  }, 300);
                }}
                className={`transition-all duration-300 rounded-full ${
                  index === current
                    ? "w-10 h-2 bg-white shadow-lg"
                    : "w-2 h-2 bg-white/50 hover:bg-white/70 hover:scale-125"
                }`}
                aria-label={`Ir al artículo ${index + 1}`}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={goNext}
            className="p-2 text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full transition-all duration-200 hover:scale-110 shadow-lg border border-white/20"
            aria-label="Siguiente artículo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsBanner;

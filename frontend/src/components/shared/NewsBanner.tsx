import React, { useState, useEffect } from "react";
import {
  Megaphone,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { articlesAPI } from "../../services/api";
import type { Article } from "../../types/article";

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

// Pastel gradient combinations (blue left + random pastel right)
const pastelGradients = [
  "linear-gradient(135deg, #596c95 0%, #ffd1dc 100%)", // pink
  "linear-gradient(135deg, #596c95 0%, #b4e7ce 100%)", // mint green
  "linear-gradient(135deg, #596c95 0%, #e8c5e5 100%)", // lavender
  "linear-gradient(135deg, #596c95 0%, #ffeaa7 100%)", // soft yellow
  "linear-gradient(135deg, #596c95 0%, #dfe6e9 100%)", // soft gray
  "linear-gradient(135deg, #596c95 0%, #fab1a0 100%)", // peach
  "linear-gradient(135deg, #596c95 0%, #a29bfe 100%)", // periwinkle
  "linear-gradient(135deg, #596c95 0%, #fd79a8 100%)", // soft coral
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

  // Auto-advance carousel with transition
  useEffect(() => {
    const timer = setInterval(() => {
      handleTransition("next");
    }, 5000);
    return () => clearInterval(timer);
  }, [news.length, current]);

  const handleTransition = (direction: "prev" | "next") => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (direction === "next") {
        setCurrent((prev) => (prev + 1) % news.length);
      } else {
        setCurrent((prev) => (prev - 1 + news.length) % news.length);
      }
      setIsTransitioning(false);
    }, 300);
  };

  const goPrev = () => handleTransition("prev");
  const goNext = () => handleTransition("next");

  const currentNews = news[current];

  // Get random gradient for current article (deterministic based on article id)
  const getGradientForArticle = (articleId: string) => {
    const hash = articleId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return pastelGradients[hash % pastelGradients.length];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  if (loading) {
    return (
      <div
        className={`bg-gradient-to-r from-[#596c95] to-[#cd6263] rounded-xl shadow-lg p-6 flex items-center gap-4 ${className}`}
      >
        <Megaphone className="w-8 h-8 text-white flex-shrink-0 animate-pulse" />
        <div className="flex-1">
          <div className="bg-blue-50/20 h-5 rounded mb-2 animate-pulse"></div>
          <div className="bg-blue-50/15 h-4 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${className}`}
      style={{
        height: "200px",
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

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Content - with slide and fade transition */}
      <div
        className={`relative z-10 h-full flex flex-col justify-center p-6 transition-all duration-500 transform ${
          isTransitioning
            ? "opacity-0 translate-x-4"
            : "opacity-100 translate-x-0"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="w-5 h-5 text-white flex-shrink-0" />
          <span className="text-white/90 text-sm font-medium">
            Últimas Noticias
          </span>
        </div>

        <div className="text-white font-bold text-xl mb-2 line-clamp-2">
          {currentNews.title}
        </div>

        <div className="text-white/90 text-sm mb-3 line-clamp-2">
          {currentNews.content}
        </div>

        <div className="text-xs text-white/70 flex items-center justify-between">
          <span>{formatDate(currentNews.published_at)}</span>
          {error && (
            <span className="flex items-center gap-1 text-yellow-200">
              <AlertCircle className="w-3 h-3" />
              API offline
            </span>
          )}
        </div>
      </div>

      {/* Enhanced Navigation Arrows */}
      {news.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-50 p-3 text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full transition-all duration-200 hover:scale-110 shadow-lg border border-white/20"
            aria-label="Artículo anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-50 p-3 text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full transition-all duration-200 hover:scale-110 shadow-lg border border-white/20"
            aria-label="Siguiente artículo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator - Bottom Progress Bar */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex gap-2">
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
                    ? "w-8 h-2 bg-white"
                    : "w-2 h-2 bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Ir al artículo ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default NewsBanner;

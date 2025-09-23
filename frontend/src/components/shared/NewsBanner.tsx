import React, { useState, useEffect } from "react";
import { Megaphone, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { articlesAPI } from "../../services/api";
import type { Article } from "../../types";

interface NewsItem extends Article {
  content: string;
  excerpt?: string;
  published_at?: string;
  created_at?: string;
  featured_image?: string;
}

// Fallback news for when API is not available or no featured articles exist
const fallbackNews: NewsItem[] = [
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
  }
];

const NewsBanner: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [news, setNews] = useState<NewsItem[]>(fallbackNews);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch featured articles/news
  useEffect(() => {
    const fetchFeaturedNews = async () => {
      try {
        setLoading(true);
        const response = await articlesAPI.getFeatured({ limit: 5, type: 'banner' });
        
        if (response?.data?.data?.articles && response.data.articles.length > 0) {
          const articles = response.data.articles.map((article: any) => ({
            id: article.id,
            title: article.title,
            content: article.excerpt || article.content,
            published_at: article.published_at || article.created_at,
            featured_image: article.featured_image_url || article.featured_image
          }));
          setNews(articles);
        } else {
          // No featured articles found, use fallback
          setNews(fallbackNews);
        }
      } catch (err) {
        console.warn('Failed to fetch featured news, using fallback:', err);
        setError(err.message);
        setNews(fallbackNews);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedNews();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % news.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [news.length]);

  const goPrev = () =>
    setCurrent((prev) => (prev - 1 + news.length) % news.length);
  const goNext = () => setCurrent((prev) => (prev + 1) % news.length);
  
  const currentNews = news[current];
  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-r from-[#596c95] to-[#cd6263] rounded-xl shadow-lg p-6 flex items-center gap-4 ${className}`}>
        <Megaphone className="w-8 h-8 text-white flex-shrink-0 animate-pulse" />
        <div className="flex-1">
          <div className="bg-white/20 h-5 rounded mb-2 animate-pulse"></div>
          <div className="bg-white/15 h-4 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-xl shadow-lg overflow-hidden ${className}`}
      style={{
        height: "200px",
        backgroundImage: currentNews.featured_image 
          ? `url(${currentNews.featured_image})` 
          : "linear-gradient(to right, #596c95, #cd6263)",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center p-6">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="w-5 h-5 text-white flex-shrink-0" />
          <span className="text-white/90 text-sm font-medium">Últimas Noticias</span>
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
      
      {/* Navigation */}
      {news.length > 1 && (
        <>
          <button 
            onClick={goPrev} 
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-black/20 rounded-full transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={goNext} 
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-black/20 rounded-full transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};

export default NewsBanner;

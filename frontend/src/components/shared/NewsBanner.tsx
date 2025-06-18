import React, { useState, useEffect } from "react";
import { Megaphone, ChevronLeft, ChevronRight } from "lucide-react";

const mockNews = [
  {
    id: 1,
    title: "¡Nuevo evento en la gallera central!",
    date: "2024-06-10",
    content: "No te pierdas el evento especial este fin de semana.",
  },
  {
    id: 2,
    title: "Actualización de la plataforma",
    date: "2024-06-09",
    content: "Mejoras en la experiencia de usuario y nuevas funciones.",
  },
  {
    id: 3,
    title: "Promoción: Duplica tu primer depósito",
    date: "2024-06-08",
    content: "Solo por tiempo limitado, duplica tu primer depósito.",
  },
  {
    id: 4,
    title: "¡Apuestas en vivo ahora disponibles!",
    date: "2024-06-07",
    content: "Disfruta de apuestas en tiempo real durante los eventos.",
  },
  {
    id: 5,
    title: "Nueva sección de noticias",
    date: "2024-06-06",
    content: "Mantente informado con las últimas novedades y anuncios.",
  },
];

const NewsBanner: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % mockNews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  const goPrev = () =>
    setCurrent((prev) => (prev - 1 + mockNews.length) % mockNews.length);
  const goNext = () => setCurrent((prev) => (prev + 1) % mockNews.length);
  const news = mockNews[current];
  return (
    <div
      className={`relative bg-gradient-to-r from-[#596c95] to-[#cd6263] rounded-xl shadow-lg p-4 flex items-center gap-4 ${className}`}
    >
      <Megaphone className="w-8 h-8 text-white flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-white font-bold truncate text-lg">
          {news.title}
        </div>
        <div className="text-white/80 text-sm truncate">{news.content}</div>
        <div className="text-xs text-white/60 mt-1">{news.date}</div>
      </div>
      <button onClick={goPrev} className="p-2 text-white/70 hover:text-white">
        <ChevronLeft />
      </button>
      <button onClick={goNext} className="p-2 text-white/70 hover:text-white">
        <ChevronRight />
      </button>
    </div>
  );
};

export default NewsBanner;

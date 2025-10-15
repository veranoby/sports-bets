// frontend/src/components/articles/ArticleCard.tsx
// Componente de tarjeta de artículo con indicadores de membresía

import React from "react";
import { Calendar, Eye, User, FileText, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import type { Article } from "../../types/article";
import { useAuth } from "../../contexts/AuthContext";

interface ArticleCardProps {
  article: Article;
  isAuthor?: boolean;
  isPremiumAuthor?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  isAuthor = false,
  isPremiumAuthor = false,
}) => {
  const { user } = useAuth();
  const isPremiumUser =
    user?.subscription?.status === "active" &&
    user.subscription.type !== "free";

  // Verificar si el artículo fue creado por un usuario premium
  const isCreatedByPremiumUser =
    isPremiumAuthor ||
    (article.author?.subscription?.status === "active" &&
      article.author.subscription.type !== "free");

  return (
    <div className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Indicador premium en la esquina superior derecha */}
      {isCreatedByPremiumUser && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
            <Crown className="w-3 h-3" />
            PREMIUM
          </span>
        </div>
      )}

      {/* Imagen del artículo */}
      {article.featured_image ? (
        <div className="relative h-48 overflow-hidden">
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <FileText className="w-12 h-12 text-gray-400" />
        </div>
      )}

      {/* Contenido */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
            {article.status === "published"
              ? "PUBLICADO"
              : article.status === "draft"
                ? "BORRADOR"
                : article.status === "pending"
                  ? "PENDIENTE"
                  : "ARCHIVADO"}
          </span>

          {/* Indicador de acceso para usuarios free */}
          {!isPremiumUser && isCreatedByPremiumUser && (
            <span className="text-xs font-medium text-yellow-600 flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Premium
            </span>
          )}
        </div>

        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {article.title}
        </h3>

        {article.excerpt && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {article.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(article.created_at).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>

            {article.author && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {article.author.username}
              </span>
            )}
          </div>

          {article.views && (
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {article.views}
            </span>
          )}
        </div>
      </div>

      {/* Overlay para usuarios free que intentan acceder a contenido premium */}
      {!isPremiumUser && isCreatedByPremiumUser && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center backdrop-blur-sm">
          <Crown className="w-12 h-12 text-yellow-400 mb-3" />
          <h4 className="text-white font-bold text-lg mb-2">
            Contenido Premium
          </h4>
          <p className="text-gray-300 text-sm mb-4">
            Este artículo fue creado por un miembro premium. Actualiza tu
            membresía para acceder.
          </p>
          <Link
            to="/profile"
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-medium px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 shadow-lg"
          >
            <Crown className="w-4 h-4" />
            Actualizar a Premium
          </Link>
        </div>
      )}
    </div>
  );
};

export default ArticleCard;

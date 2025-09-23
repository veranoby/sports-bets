// frontend/src/pages/user/UserProfilePage.tsx
// ================================================================
// Componente reutilizable para mostrar perfiles de Galleras y Venues

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usersAPI, articlesAPI } from "../../services/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import Card from "../../components/shared/Card";
import type { User } from "../../types";
import {
  MapPin,
  ChevronLeft,
  BookOpen,
  Calendar,
  User as UserIcon,
} from "lucide-react";

interface ArticleLite {
  id: string;
  title: string;
  summary?: string;
  createdAt?: string;
  created_at?: string;
}

const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<ArticleLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No se proporcionó un ID de usuario.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const userResponse = await usersAPI.getById(id);
        setUser(userResponse.data);

        const articlesResponse = await articlesAPI.getAll({ author_id: id });
        setArticles(articlesResponse.data.articles || []);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("No se pudo cargar el perfil. Inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner text="Cargando perfil..." />;
  if (error) return <Card variant="error">{error}</Card>;
  if (!user)
    return <EmptyState title="Usuario no encontrado" icon={<UserIcon />} />;

  const profileName = user.profileInfo?.fullName || user.username;
  const location = user.profileInfo?.address || "Ubicación no especificada";
  const description = "Sin descripción.";

  return (
    <div className="page-background space-y-4 p-4">
      <button
        onClick={() => navigate(-1)} // Volver a la página anterior
        className="flex items-center gap-2 text-sm text-theme-light hover:text-theme-primary mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver
      </button>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <img
            src={"/placeholder.svg"}
            alt={profileName}
            className="w-24 h-24 rounded-full object-cover border-4 border-theme-primary"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-theme-primary mb-2">
              {profileName}
            </h1>
            <div className="flex items-center gap-2 text-theme-light mb-3">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
            <p className="text-theme-secondary">{description}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-theme-primary mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Artículos
        </h2>
        {articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer"
              >
                <h3 className="font-semibold text-theme-primary">
                  {article.title}
                </h3>
                <p className="text-sm text-theme-secondary line-clamp-2 mt-1">
                  {article.summary}
                </p>
                <div className="text-xs text-theme-light mt-2 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(
                      article.createdAt || article.created_at || Date.now(),
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin artículos"
            description={`${profileName} aún no ha publicado artículos.`}
          />
        )}
      </Card>
    </div>
  );
};

export default UserProfilePage;

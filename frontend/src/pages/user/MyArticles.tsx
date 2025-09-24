import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { articlesAPI } from "../../config/api";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import { Edit, Eye, Clock, CheckCircle, XCircle } from "lucide-react";

interface Article {
  id: string;
  title: string;
  status: string;
}

const MyArticlesPage: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyArticles = async () => {
      if (!user) return;
      try {
        const response = await articlesAPI.getAll({ author_id: user.id });
        setArticles(response.data.articles);
      } catch (error) {
        console.error("Error loading articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyArticles();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) return <LoadingSpinner text="Cargando tus artículos..." />;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Artículos</h1>
        <Link
          to="/user/articles/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Crear Artículo
        </Link>
      </div>

      {articles.length === 0 ? (
        <EmptyState
          title="No tienes artículos"
          description="Empieza a crear contenido para compartir con la comunidad."
          buttonText="Crear mi primer artículo"
          buttonLink="/user/articles/create"
        />
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {articles.map((article: Article) => (
              <li
                key={article.id}
                className="p-4 hover:bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800">{article.title}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    {getStatusIcon(article.status)}
                    <span>{article.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    to={`/articles/${article.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  <Link
                    to={`/user/articles/edit/${article.id}`}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MyArticlesPage;

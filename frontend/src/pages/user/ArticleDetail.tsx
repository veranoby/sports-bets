import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../../config/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Card from "../../components/shared/Card";
import SocialShare from "../../components/shared/SocialShare";

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/articles/${id}`);
        setArticle(response.data.data);
      } catch (err: unknown) { // Changed from 'any' to 'unknown' for better type safety
        setError(err?.message || "Error al cargar el artículo");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id]);

  if (loading) return <LoadingSpinner text="Cargando artículo..." />;
  if (error) return <Card variant="error">{error}</Card>;
  if (!article) return <Card>Artículo no encontrado.</Card>;

  return (
    <div className="page-background space-y-4 p-4">
      <Card className="p-4">
        <h1 className="text-2xl font-bold mb-4">{article.title}</h1>
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-3">Compartir artículo</h3>
          <SocialShare
            url={window.location.href}
            title={article.title}
            description={article.excerpt}
          />
        </div>
      </Card>
    </div>
  );
};

export default ArticleDetailPage;

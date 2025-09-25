import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, Calendar, Eye, Edit, Trash2, ChevronRight } from "lucide-react";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import Modal from "../../components/shared/Modal";
import { articlesAPI } from "../../services/api";
import ArticleEditor from "./ArticleEditor";
import type {
  Article,
  ArticleFormData,
  ArticleFormErrors,
} from "../../types/article";
import StatusChip from "../../components/shared/StatusChip";

// Article Card Component - Following Events page patterns
const ArticleCard = React.memo(
  ({
    article,
    onEdit,
    onPreview,
    onDelete,
  }: {
    article: Article;
    onEdit: () => void;
    onPreview: () => void;
    onDelete: () => void;
  }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "published":
          return "text-green-400";
        case "draft":
          return "text-yellow-400";
        case "pending":
          return "text-blue-400";
        case "archived":
          return "text-gray-400";
        default:
          return "text-theme-light";
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case "published":
          return "Publicado";
        case "draft":
          return "Borrador";
        case "pending":
          return "En Revisión";
        case "archived":
          return "Archivado";
        default:
          return status;
      }
    };

    return (
      <div className="card-background p-4 cursor-pointer hover:bg-[#2a325c]/80 transition-all duration-200 transform hover:scale-[1.02]">
        {/* Article Image */}
        {article.featured_image && (
          <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <StatusChip
            status={article.status}
            label={getStatusLabel(article.status)}
            className={getStatusColor(article.status)}
          />
          <ChevronRight className="w-4 h-4 text-theme-light" />
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-theme-primary line-clamp-2">
            {article.title}
          </h3>

          {article.excerpt && (
            <p className="text-sm text-theme-light line-clamp-2">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-theme-light">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(article.created_at).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#596c95]/20">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors"
              title="Previsualizar"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-yellow-400 hover:text-yellow-300 p-1 rounded transition-colors"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {article.status === "published" && article.published_at && (
            <span className="text-xs text-green-400">Publicado</span>
          )}
        </div>
      </div>
    );
  },
);

const ArticleManagement: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  // Form state
  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    excerpt: "",
    content: "",
    featured_image: "",
    status: "draft",
  });
  const [formErrors, setFormErrors] = useState<ArticleFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get articles for the current user (gallera)
      const response = await articlesAPI.getAll({
        author_id: user?.id,
        limit: 50,
        includeAuthor: true,
      });

      setArticles((response.data as { articles: Article[] })?.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading articles");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Form validation
  const validateForm = (data: ArticleFormData): ArticleFormErrors => {
    const errors: ArticleFormErrors = {};

    if (!data.title.trim()) {
      errors.title = "El título es requerido";
    } else if (data.title.length < 5 || data.title.length > 255) {
      errors.title = "El título debe tener entre 5 y 255 caracteres";
    }

    if (!data.excerpt.trim()) {
      errors.excerpt = "El resumen es requerido";
    } else if (data.excerpt.length < 10 || data.excerpt.length > 500) {
      errors.excerpt = "El resumen debe tener entre 10 y 500 caracteres";
    }

    if (!data.content.trim()) {
      errors.content = "El contenido es requerido";
    } else if (data.content.length < 10) {
      errors.content = "El contenido debe tener al menos 10 caracteres";
    }

    if (data.featured_image && data.featured_image.trim()) {
      try {
        new URL(data.featured_image);
      } catch {
        errors.featured_image = "Por favor, ingresa una URL válida";
      }
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);

      if (editingArticle) {
        // Update existing article
        const updatePayload = {
          title: formData.title,
          content: formData.content,
          summary: formData.excerpt,
          featured_image_url: formData.featured_image,
        };
        const response = await articlesAPI.update(
          editingArticle.id,
          updatePayload,
        );
        setArticles((prev) =>
          prev.map((article) =>
            article.id === editingArticle.id
              ? { ...article, ...(response.data as Article) }
              : article,
          ),
        );
        setShowEditModal(false);
      } else {
        // Create new article
        const createPayload = {
          title: formData.title,
          content: formData.content,
          summary: formData.excerpt,
          featured_image_url: formData.featured_image,
        };
        const response = await articlesAPI.create(createPayload);
        setArticles((prev) => [response.data as Article, ...prev]);
        setShowCreateModal(false);
      }

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar el artículo",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (articleId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este artículo?")) {
      return;
    }

    try {
      await articlesAPI.delete(articleId);
      setArticles((prev) => prev.filter((article) => article.id !== articleId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar el artículo",
      );
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (article: Article) => {
    setFormData({
      title: article.title,
      excerpt: article.excerpt || "",
      content: article.content,
      featured_image: article.featured_image || "",
      status: article.status as "draft" | "pending" | "published",
    });
    setEditingArticle(article);
    setShowEditModal(true);
  };

  const openPreviewModal = (article: Article) => {
    setPreviewArticle(article);
    setShowPreviewModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      featured_image: "",
      status: "draft",
    });
    setFormErrors({});
    setEditingArticle(null);
  };

  const closeAllModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowPreviewModal(false);
    setPreviewArticle(null);
    resetForm();
  };

  // Group articles by status
  const articlesByStatus = {
    draft: articles.filter((a) => a.status === "draft"),
    pending: articles.filter((a) => a.status === "pending"),
    published: articles.filter((a) => a.status === "published"),
    archived: articles.filter((a) => a.status === "archived"),
  };

  if (loading) {
    return <LoadingSpinner text="Cargando tus artículos..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header with sophisticated styling matching Events page */}
      <div className="card-background p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
              📰 Mis Artículos
            </h1>
            <p className="text-theme-light">
              Gestiona y crea contenido de calidad
            </p>
          </div>

          {/* Article Statistics */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-theme-light">Publicados:</span>
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                {articlesByStatus.published.length}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-theme-light">Borradores:</span>
              <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
                {articlesByStatus.draft.length}
              </span>
            </div>
            <button
              onClick={openCreateModal}
              className="btn-primary flex items-center gap-2 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Nuevo Artículo
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorMessage error={error} onRetry={fetchArticles} />}

      {/* Enhanced Article Cards Grid - Matching Events page sophistication */}
      {articles.length === 0 ? (
        <div className="card-background p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
            📝
          </div>
          <h3 className="text-lg font-semibold text-theme-primary mb-2">
            ¡Comienza a escribir!
          </h3>
          <p className="text-theme-light mb-6">
            Crea tu primer artículo y comparte tus conocimientos con la
            comunidad galística
          </p>
          <button onClick={openCreateModal} className="btn-primary">
            Crear Mi Primer Artículo
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Published Articles */}
          {articlesByStatus.published.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Artículos Publicados ({articlesByStatus.published.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articlesByStatus.published.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onEdit={() => openEditModal(article)}
                    onPreview={() => openPreviewModal(article)}
                    onDelete={() => handleDelete(article.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Draft Articles */}
          {articlesByStatus.draft.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Borradores ({articlesByStatus.draft.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articlesByStatus.draft.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onEdit={() => openEditModal(article)}
                    onPreview={() => openPreviewModal(article)}
                    onDelete={() => handleDelete(article.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending Articles */}
          {articlesByStatus.pending.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                En Revisión ({articlesByStatus.pending.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articlesByStatus.pending.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onEdit={() => openEditModal(article)}
                    onPreview={() => openPreviewModal(article)}
                    onDelete={() => handleDelete(article.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Article Modal */}
      <ArticleEditor
        isOpen={showCreateModal}
        onClose={closeAllModals}
        title="Crear Nuevo Artículo"
        formData={formData}
        formErrors={formErrors}
        onChange={(field, value) =>
          setFormData((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={handleSubmit}
        submitting={submitting}
        isEditing={false}
      />

      {/* Edit Article Modal */}
      <ArticleEditor
        isOpen={showEditModal}
        onClose={closeAllModals}
        title="Editar Artículo"
        formData={formData}
        formErrors={formErrors}
        onChange={(field, value) =>
          setFormData((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={handleSubmit}
        submitting={submitting}
        isEditing={true}
      />

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={closeAllModals}
        title="Previsualizar Artículo"
        size="lg"
      >
        {previewArticle && (
          <div className="space-y-4">
            {previewArticle.featured_image && (
              <img
                src={previewArticle.featured_image}
                alt=""
                className="w-full h-64 object-cover rounded-lg"
              />
            )}

            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {previewArticle.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span>
                  Estado:{" "}
                  <StatusChip status={previewArticle.status} size="sm" />
                </span>
                <span>
                  Creado:{" "}
                  {new Date(previewArticle.created_at).toLocaleDateString()}
                </span>
                {previewArticle.published_at && (
                  <span>
                    Publicado:{" "}
                    {new Date(previewArticle.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <p className="text-lg text-gray-700 mb-6 font-medium">
                {previewArticle.excerpt}
              </p>

              <div className="prose prose-sm max-w-none">
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: previewArticle.content.replace(/\n/g, "<br>"),
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ArticleManagement;

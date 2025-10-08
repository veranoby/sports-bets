import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Plus,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Archive,
  ChevronRight,
} from "lucide-react";
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
    onArchive,
  }: {
    article: Article;
    onEdit: () => void;
    onPreview: () => void;
    onDelete: () => void;
    onArchive: () => void;
  }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "published":
          return "text-green-600";
        case "draft":
          return "text-yellow-400";
        case "pending":
          return "text-blue-600";
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

          {article.summary && (
            <p className="text-sm text-theme-light line-clamp-2">
              {article.summary}
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
              className="text-blue-600 hover:text-blue-300 p-1 rounded transition-colors"
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
                onArchive();
              }}
              className="text-gray-400 hover:text-gray-300 p-1 rounded transition-colors"
              title="Archivar"
            >
              <Archive className="w-4 h-4" />
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
            <span className="text-xs text-green-600">Publicado</span>
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

  const handleFormSubmit = async (
    status: "draft" | "pending" | "published" | "archived",
  ) => {
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        featured_image: formData.featured_image,
        status: status,
      };

      if (editingArticle) {
        // Update existing article
        const response = await articlesAPI.update(editingArticle.id, payload);
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
        const response = await articlesAPI.create(payload);
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

  // Handle form submission for publishing
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For non-admins, this will go to 'pending' status on the backend
    handleFormSubmit("pending");
  };

  // Handle saving as a draft
  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    handleFormSubmit("draft");
  };

  // Handle delete
  const handleDelete = async (articleId: string) => {
    if (
      window.confirm("¿Estás seguro de que quieres eliminar este artículo?")
    ) {
      try {
        await articlesAPI.delete(articleId);
        setArticles((prev) =>
          prev.filter((article) => article.id !== articleId),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al eliminar el artículo",
        );
      }
    }
  };

  // Handle archive
  const handleArchive = async (article: Article) => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres archivar este artículo? No será visible públicamente.",
      )
    ) {
      try {
        const response = await articlesAPI.update(article.id, {
          status: "archived",
        });
        setArticles((prev) =>
          prev.map((a) =>
            a.id === article.id ? { ...a, ...(response.data as Article) } : a,
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al archivar el artículo",
        );
      }
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
      excerpt: article.summary || "",
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
    draft: articles.filter((a) => a && a.status === "draft"),
    pending: articles.filter((a) => a && a.status === "pending"),
    published: articles.filter((a) => a && a.status === "published"),
    archived: articles.filter((a) => a && a.status === "archived"),
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
              <p className="text-sm text-theme-light">
                Gestiona y crea contenido de calidad
              </p>
            </h1>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Article Statistics */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-theme-light">Publicados:</span>
              <span className="bg-green-500/20 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
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
          <p className="text-sm text-theme-light mb-6">
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
                    onArchive={() => handleArchive(article)}
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
                    onArchive={() => handleArchive(article)}
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
                    onArchive={() => handleArchive(article)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Archived Articles */}
          {articlesByStatus.archived.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                Archivados ({articlesByStatus.archived.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articlesByStatus.archived.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onEdit={() => openEditModal(article)}
                    onPreview={() => openPreviewModal(article)}
                    onDelete={() => handleDelete(article.id)}
                    onArchive={() => handleArchive(article)}
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
        onSaveDraft={handleSaveDraft}
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
        onSaveDraft={handleSaveDraft}
        submitting={submitting}
        isEditing={true}
      />

      {/* Enhanced Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={closeAllModals}
        title=""
        size="4xl"
      >
        {previewArticle && (
          <div className="max-h-[80vh] overflow-y-auto">
            {/* Header with Status and Actions */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Previsualización del Artículo
                  </h2>
                  <StatusChip status={previewArticle.status} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    Creado:{" "}
                    {new Date(previewArticle.created_at).toLocaleDateString()}
                  </span>
                  {previewArticle.published_at && (
                    <>
                      <span>•</span>
                      <span>
                        Publicado:{" "}
                        {new Date(
                          previewArticle.published_at,
                        ).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="px-6 pb-6">
              <article className="max-w-4xl mx-auto">
                {/* Featured Image */}
                {previewArticle.featured_image && (
                  <div className="mb-8">
                    <img
                      src={previewArticle.featured_image}
                      alt={previewArticle.title}
                      className="w-full h-80 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                )}

                {/* Article Header */}
                <header className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    {previewArticle.title}
                  </h1>

                  {/* Author and Date Info */}
                  <div className="flex items-center gap-4 text-gray-600 mb-6">
                    {previewArticle.author_name && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {previewArticle.author_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">
                          {previewArticle.author_name}
                        </span>
                      </div>
                    )}
                    {previewArticle.venue_name && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">
                          {previewArticle.venue_name}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Excerpt/Summary */}
                  {(previewArticle.summary || previewArticle.excerpt) && (
                    <div className="bg-gray-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                      <p className="text-lg text-gray-700 italic leading-relaxed">
                        {previewArticle.summary || previewArticle.excerpt}
                      </p>
                    </div>
                  )}
                </header>

                {/* Article Content */}
                <div className="prose prose-lg max-w-none">
                  <div
                    className="text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: previewArticle.content,
                    }}
                  />
                </div>

                {/* Article Footer */}
                <footer className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <p>
                        Artículo creado el{" "}
                        {new Date(previewArticle.created_at).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                      {previewArticle.updated_at &&
                        previewArticle.updated_at !==
                          previewArticle.created_at && (
                          <p className="mt-1">
                            Última actualización:{" "}
                            {new Date(
                              previewArticle.updated_at,
                            ).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        )}
                    </div>
                    {(previewArticle.status === "draft" ||
                      previewArticle.status === "pending") && (
                      <button
                        onClick={() => {
                          closeAllModals();
                          openEditModal(previewArticle);
                        }}
                        className="btn-primary flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Editar Artículo
                      </button>
                    )}
                  </div>
                </footer>
              </article>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ArticleManagement;

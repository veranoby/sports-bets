import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Plus } from "lucide-react";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import Modal from "../../components/shared/Modal";
import { articlesAPI } from "../../config/api";
import ArticleEditor from "./ArticleEditor";
import ArticleList from "./ArticleList";
import type { Article, ArticleFormData, ArticleFormErrors } from "../../types/article";
import StatusChip from "../../components/shared/StatusChip";

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
    featured_image: ""
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
        includeAuthor: true
      });
      
      setArticles(response.data?.articles || []);
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
        const response = await articlesAPI.update(editingArticle.id, updatePayload);
        setArticles(prev => prev.map(article => 
          article.id === editingArticle.id ? { ...article, ...response.data } : article
        ));
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
        setArticles(prev => [response.data, ...prev]);
        setShowCreateModal(false);
      }
      
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el artículo");
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
      setArticles(prev => prev.filter(article => article.id !== articleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el artículo");
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
      featured_image: article.featured_image || ""
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
      featured_image: ""
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
    draft: articles.filter(a => a.status === "draft"),
    pending: articles.filter(a => a.status === "pending"),
    published: articles.filter(a => a.status === "published"),
    archived: articles.filter(a => a.status === "archived")
  };

  if (loading) {
    return <LoadingSpinner text="Cargando tus artículos..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Artículos</h1>
            <p className="text-gray-600">Gestiona y crea tus artículos</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear Artículo
          </button>
        </div>

        {error && (
          <ErrorMessage error={error} onRetry={fetchArticles} className="mb-6" />
        )}

        <ArticleList
          articles={articles}
          articlesByStatus={articlesByStatus}
          onOpenCreateModal={openCreateModal}
          onOpenEditModal={openEditModal}
          onOpenPreviewModal={openPreviewModal}
          onDelete={handleDelete}
        />

        {/* Create Article Modal */}
        <ArticleEditor
          isOpen={showCreateModal}
          onClose={closeAllModals}
          title="Crear Nuevo Artículo"
          formData={formData}
          formErrors={formErrors}
          onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
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
          onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
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
                  <span>Estado: <StatusChip status={previewArticle.status} size="sm" /></span>
                  <span>Creado: {new Date(previewArticle.created_at).toLocaleDateString()}</span>
                  {previewArticle.published_at && (
                    <span>Publicado: {new Date(previewArticle.published_at).toLocaleDateString()}</span>
                  )}
                </div>
                
                <p className="text-lg text-gray-700 mb-6 font-medium">
                  {previewArticle.excerpt}
                </p>
                
                <div className="prose prose-sm max-w-none">
                  <div
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: previewArticle.content.replace(/\n/g, "<br>")
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ArticleManagement;

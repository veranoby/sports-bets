import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FileText, Plus, Edit, Eye, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import StatusChip from "../../components/shared/StatusChip";
import Modal from "../../components/shared/Modal";
import FormField from "../../components/shared/FormField";
import { articlesAPI } from "../../config/api";

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  status: "draft" | "pending" | "published" | "archived";
  featured_image_url?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

interface ArticleFormData {
  title: string;
  summary: string;
  content: string;
  featured_image_url?: string;
}

const MyArticlesPage: React.FC = () => {
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
    summary: "",
    content: "",
    featured_image_url: ""
  });
  const [formErrors, setFormErrors] = useState<Partial<ArticleFormData>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get articles for the current user (gallera)
      const response = await articlesAPI.getAll({
        authorId: user?.id,
        limit: 100,
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
  const validateForm = (data: ArticleFormData): Partial<ArticleFormData> => {
    const errors: Partial<ArticleFormData> = {};
    
    if (!data.title.trim()) {
      errors.title = "Title is required";
    } else if (data.title.length < 5 || data.title.length > 255) {
      errors.title = "Title must be between 5 and 255 characters";
    }
    
    if (!data.summary.trim()) {
      errors.summary = "Summary is required";
    } else if (data.summary.length < 10 || data.summary.length > 500) {
      errors.summary = "Summary must be between 10 and 500 characters";
    }
    
    if (!data.content.trim()) {
      errors.content = "Content is required";
    } else if (data.content.length < 10) {
      errors.content = "Content must be at least 10 characters";
    }
    
    if (data.featured_image_url && data.featured_image_url.trim()) {
      try {
        new URL(data.featured_image_url);
      } catch {
        errors.featured_image_url = "Please enter a valid URL";
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
        const response = await articlesAPI.update(editingArticle.id, formData);
        setArticles(prev => prev.map(article => 
          article.id === editingArticle.id ? { ...article, ...response.data } : article
        ));
        setShowEditModal(false);
      } else {
        // Create new article
        const response = await articlesAPI.create(formData);
        setArticles(prev => [response.data, ...prev]);
        setShowCreateModal(false);
      }
      
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving article");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (articleId: string) => {
    if (!confirm("Are you sure you want to delete this article?")) {
      return;
    }
    
    try {
      await articlesAPI.delete(articleId);
      setArticles(prev => prev.filter(article => article.id !== articleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting article");
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
      summary: article.summary,
      content: article.content,
      featured_image_url: article.featured_image_url || ""
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
      summary: "",
      content: "",
      featured_image_url: ""
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
    return <LoadingSpinner text="Loading your articles..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Articles</h1>
            <p className="text-gray-600">Manage and create your articles</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Article
          </button>
        </div>

        {error && (
          <ErrorMessage error={error} onRetry={fetchArticles} className="mb-6" />
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-xl font-bold text-gray-900">{articlesByStatus.pending.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-xl font-bold text-gray-900">{articlesByStatus.published.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-xl font-bold text-gray-900">{articlesByStatus.draft.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Archived</p>
                <p className="text-xl font-bold text-gray-900">{articlesByStatus.archived.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Articles List */}
        {articles.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
            <p className="text-gray-600 mb-6">Start creating your first article to share with the community.</p>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create First Article
            </button>
          </Card>
        ) : (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Articles</h2>
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Article Preview */}
                  <div className="w-20 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    {article.featured_image_url ? (
                      <img
                        src={article.featured_image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Article Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{article.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{article.summary}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Created: {new Date(article.created_at).toLocaleDateString()}</span>
                      {article.published_at && (
                        <span>Published: {new Date(article.published_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3">
                    <StatusChip status={article.status} size="sm" />
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => openPreviewModal(article)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {(article.status === "draft" || article.status === "pending") && (
                        <button
                          onClick={() => openEditModal(article)}
                          className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      
                      {article.status === "draft" && (
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Create Article Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={closeAllModals}
          title="Create New Article"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="Title"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              error={formErrors.title}
              required
              maxLength={255}
            />
            
            <FormField
              label="Summary"
              name="summary"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              error={formErrors.summary}
              required
              maxLength={500}
              as="textarea"
              rows={3}
            />
            
            <FormField
              label="Featured Image URL (optional)"
              name="featured_image_url"
              type="url"
              value={formData.featured_image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, featured_image_url: e.target.value }))}
              error={formErrors.featured_image_url}
            />
            
            <FormField
              label="Content"
              name="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              error={formErrors.content}
              required
              as="textarea"
              rows={12}
            />
            
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={closeAllModals}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Creating..." : "Create Article"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Article Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={closeAllModals}
          title="Edit Article"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="Title"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              error={formErrors.title}
              required
              maxLength={255}
            />
            
            <FormField
              label="Summary"
              name="summary"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              error={formErrors.summary}
              required
              maxLength={500}
              as="textarea"
              rows={3}
            />
            
            <FormField
              label="Featured Image URL (optional)"
              name="featured_image_url"
              type="url"
              value={formData.featured_image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, featured_image_url: e.target.value }))}
              error={formErrors.featured_image_url}
            />
            
            <FormField
              label="Content"
              name="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              error={formErrors.content}
              required
              as="textarea"
              rows={12}
            />
            
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={closeAllModals}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Updating..." : "Update Article"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Preview Modal */}
        <Modal
          isOpen={showPreviewModal}
          onClose={closeAllModals}
          title="Article Preview"
          size="lg"
        >
          {previewArticle && (
            <div className="space-y-4">
              {previewArticle.featured_image_url && (
                <img
                  src={previewArticle.featured_image_url}
                  alt=""
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {previewArticle.title}
                </h1>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>Status: <StatusChip status={previewArticle.status} size="sm" /></span>
                  <span>Created: {new Date(previewArticle.created_at).toLocaleDateString()}</span>
                  {previewArticle.published_at && (
                    <span>Published: {new Date(previewArticle.published_at).toLocaleDateString()}</span>
                  )}
                </div>
                
                <p className="text-lg text-gray-700 mb-6 font-medium">
                  {previewArticle.summary}
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

export default MyArticlesPage;
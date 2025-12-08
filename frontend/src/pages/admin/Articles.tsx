// frontend/src/pages/admin/Articles.tsx
// 📰 GESTIÓN NOTICIAS/ARTÍCULOS ADMIN - Layout 2 secciones optimizado
// Secciones: Pendientes Aprobación → Gestión General (filtros + historial)

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  Calendar,
  User,
  Building2,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  XCircle,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import StatusChip from "../../components/shared/StatusChip";
import ArticleEditorForm from "../../components/admin/ArticleEditorForm";

// APIs
import { articlesAPI, userAPI } from "../../services/api";

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  status: "draft" | "pending" | "published" | "archived";
  author_id: string;
  venue_id?: string;
  featured_image_url?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  venue_name?: string;
}

interface Venue {
  id: string;
  name: string;
}

const AdminArticlesPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Estados principales
  const [articles, setArticles] = useState<Article[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || searchParams.get("filter") || "",
  );
  const [authorFilter, setAuthorFilter] = useState(
    searchParams.get("author") || "",
  );
  const [venueFilter, setVenueFilter] = useState(
    searchParams.get("venue") || "",
  );

  // Paginación
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1"),
  );

  // Selección múltiple
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Modal crear/editar
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Modal preview
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  // Modal eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);

  // Estados para artículos pendientes
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);

  // Modal rechazo
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingArticleId, setRejectingArticleId] = useState<string | null>(
    null,
  );
  const [rejectionMessage, setRejectionMessage] = useState("");

  // Funciones auxiliares que faltan
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    // For admin, fetch ALL articles (not just published) by not applying status filter
    // The backend will return all for admin when no status is specified
    const articlesRes = await articlesAPI.getAll({
      limit: 1000,
      includeAuthor: true,
      includeVenue: true,
    });
    const venuesRes = await userAPI.getAll({
      role: "venue",
      limit: 100,
    });

    if (articlesRes.success && venuesRes.success) {
      // The API returns data in the format { success: boolean, data: { articles: [...], pagination: {...} } }
      const articleData = articlesRes.data;
      setArticles(
        Array.isArray(articleData)
          ? articleData
          : (articleData as any)?.articles || [],
      );
      setVenues((venuesRes.data as any)?.venues || []);
      // Actualizar pendientes
      setPendingArticles(
        (Array.isArray(articleData)
          ? articleData
          : (articleData as any)?.articles || []
        ).filter((a: Article) => a.status === "pending") || [],
      );
    } else {
      setError(
        articlesRes.error || venuesRes.error || "Error loading articles",
      );
    }
    setLoading(false);
  };

  // Filtrar artículos según filtros
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || article.status === statusFilter;
    const matchesAuthor =
      !authorFilter ||
      (article.author_name &&
        article.author_name.toLowerCase().includes(authorFilter.toLowerCase()));
    const matchesVenue = !venueFilter || article.venue_id === venueFilter;

    return matchesSearch && matchesStatus && matchesAuthor && matchesVenue;
  });

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredArticles.length / 10); // 10 artículos por página

  // Fetch inicial
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      const articlesRes = await articlesAPI.getAll({
        limit: 1000,
        includeAuthor: true,
        includeVenue: true,
      });
      const venuesRes = await userAPI.getAll({
        role: "venue",
        limit: 100,
      });

      if (articlesRes.success && venuesRes.success) {
        // The API returns data in the format { success: boolean, data: { articles: [...], pagination: {...} } }
        const articleData = articlesRes.data;
        setArticles(
          Array.isArray(articleData)
            ? articleData
            : (articleData as any)?.articles || [],
        );
        setVenues((venuesRes.data as any)?.venues || []);
      } else {
        setError(
          articlesRes.error || venuesRes.error || "Error loading articles",
        );
      }
      setLoading(false);
    };
    fetchArticles();
  }, []);

  // Componentes auxiliares
  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Funciones que faltan
  const openPreview = (article: Article) => {
    setPreviewArticle(article);
  };

  const closePreview = () => {
    setPreviewArticle(null);
  };

  const handleApproveArticle = async (articleId: string) => {
    try {
      const result = await articlesAPI.approve(articleId);
      if (result.success) {
        fetchData(); // Refrescar lista
      } else {
        setError(result.error || "Error al aprobar artículo");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const openRejectModal = (articleId: string) => {
    setRejectingArticleId(articleId);
    setRejectionMessage("");
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectingArticleId(null);
    setRejectionMessage("");
  };

  const handleRejectArticle = async () => {
    if (!rejectingArticleId) return;

    if (rejectionMessage.trim().length < 10) {
      setError("El mensaje de rechazo debe tener al menos 10 caracteres");
      return;
    }

    if (rejectionMessage.trim().length > 500) {
      setError("El mensaje de rechazo no debe exceder 500 caracteres");
      return;
    }

    try {
      const result = await articlesAPI.reject(
        rejectingArticleId,
        rejectionMessage.trim(),
      );
      if (result.success) {
        closeRejectModal();
        fetchData(); // Refrescar lista
      } else {
        setError(result.error || "Error al rechazar artículo");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const openDeleteModal = (articleId: string) => {
    setDeletingArticleId(articleId);
    setShowDeleteModal(true);
  };

  const confirmDeleteArticle = async () => {
    if (!deletingArticleId) return;

    // Use the stored deletingArticleId for the actual API call
    const articleIdToDelete = deletingArticleId;

    if (
      window.confirm(
        "¿Estás seguro de que quieres eliminar este artículo? Esta acción es irreversible.",
      )
    ) {
      try {
        const result = await articlesAPI.delete(articleIdToDelete);
        if (result.success) {
          fetchData(); // Refrescar lista
          setShowDeleteModal(false); // Close modal on success
          setDeletingArticleId(null); // Clear deleting ID
        } else {
          setError(result.error || "Error al eliminar artículo");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    }
  };

  const handleBulkApprove = async () => {
    try {
      const results = await Promise.all(
        selectedArticles.map((id) => articlesAPI.approve(id)),
      );
      if (results.every((r) => r.success)) {
        setSelectedArticles([]);
        setShowBulkActions(false);
        fetchData(); // Refrescar lista
      } else {
        setError("Algunos artículos no pudieron ser aprobados");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleBulkReject = async () => {
    const message = window.prompt(
      "Ingresa el mensaje de rechazo (10-500 caracteres):",
    );
    if (!message) return;

    if (message.trim().length < 10 || message.trim().length > 500) {
      setError("El mensaje debe tener entre 10 y 500 caracteres");
      return;
    }

    try {
      const results = await Promise.all(
        selectedArticles.map((id) => articlesAPI.reject(id, message.trim())),
      );
      if (results.every((r) => r.success)) {
        setSelectedArticles([]);
        setShowBulkActions(false);
        fetchData(); // Refrescar lista
      } else {
        setError("Algunos artículos no pudieron ser rechazados");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const clearSelection = () => {
    setSelectedArticles([]);
    setShowBulkActions(false);
  };

  const toggleArticleSelection = (articleId: string) => {
    setSelectedArticles((prev) =>
      prev.includes(articleId)
        ? prev.filter((id) => id !== articleId)
        : [...prev, articleId],
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredArticles.map((a) => a.id);
    setSelectedArticles(visibleIds);
  };

  const openCreateModal = () => {
    setEditingArticle(null);
    setShowArticleModal(true);
  };

  const closeArticleModal = () => {
    setShowArticleModal(false);
    setEditingArticle(null);
  };

  const openEditModal = (article: Article) => {
    setEditingArticle(article);
    setShowArticleModal(true);
  };

  const handleToggleStatus = async (
    articleId: string,
    currentStatus: string,
  ) => {
    const newStatus = currentStatus === "published" ? "archived" : "published";
    const result = await articlesAPI.update(articleId, { status: newStatus });
    if (result.success) {
      fetchData(); // Refrescar lista
    }
  };

  const handleArticleSaved = () => {
    fetchData(); // Refrescar lista después de guardar
    closeArticleModal();
  };

  if (loading) {
    return <LoadingSpinner text="Cargando artículos..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Noticias
        </h1>
        <p className="text-gray-600">{articles.length} artículos totales</p>
      </div>

      {error && (
        <ErrorMessage error={error} onRetry={fetchData} className="mb-6" />
      )}

      {/* Sección 1: Pendientes Aprobación */}
      {pendingArticles.length > 0 && (
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              🟡 Artículos Pendientes de Aprobación ({pendingArticles.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedArticles(pendingArticles.map((a) => a.id));
                  setShowBulkActions(true);
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Seleccionar todos
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {pendingArticles.map((article) => (
              <div
                key={article.id}
                className="flex gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                {/* Preview con imagen */}
                <div className="w-24 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
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

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusChip status={article.status} size="sm" />
                    <h3 className="font-medium text-gray-900 truncate">
                      {article.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{article.author_name}</span>
                    </div>
                    {article.venue_name && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>{article.venue_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => openPreview(article)}
                    className="px-3 py-1 text-sm font-medium rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Visualizar
                  </button>
                  <button
                    onClick={() => openEditModal(article)}
                    className="px-3 py-1 text-sm font-medium rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleApproveArticle(article.id)}
                    className="px-3 py-1 text-sm font-medium rounded border border-green-600 text-green-700 bg-green-50 hover:bg-green-100"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => openRejectModal(article.id)}
                    className="px-3 py-1 text-sm font-medium rounded border border-red-600 text-red-700 bg-red-50 hover:bg-red-100"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => openDeleteModal(article.id)}
                    className="px-3 py-1 text-sm font-medium rounded border border-red-800 text-red-800 bg-red-50 hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Acciones masivas */}
      {showBulkActions && selectedArticles.length > 0 && (
        <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedArticles.length} artículo(s) seleccionado(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkApprove}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Aprobar Seleccionados
              </button>
              <button
                onClick={handleBulkReject}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Rechazar Seleccionados
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Sección 2: Gestión General */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Gestión General de Articulos
          </h2>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Artículo
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por título, contenido..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtro Estado */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="published">Publicados</option>
              <option value="pending">Pendientes</option>
              <option value="draft">Borradores</option>
              <option value="archived">Archivados</option>
            </select>

            {/* Filtro Autor */}
            <input
              type="text"
              placeholder="Filtrar por autor..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
            />

            {/* Filtro Venue */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
            >
              <option value="">Todas las galleras</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          {/* Limpiar filtros */}
          {(searchTerm || statusFilter || authorFilter || venueFilter) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Filtros activos:</span>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setAuthorFilter("");
                  setVenueFilter("");
                  setCurrentPage(1);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpiar todos
              </button>
            </div>
          )}
        </div>

        {/* Lista de artículos */}
        <div className="space-y-4">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron artículos con los filtros aplicados
            </div>
          ) : (
            filteredArticles.map((article) => (
              <div
                key={article.id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                {/* Imagen preview */}
                <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  {article.featured_image_url ? (
                    <img
                      src={article.featured_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Contenido principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {truncateText(article.summary, 80)}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{article.author_name}</span>
                        </div>
                        {article.venue_name && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span>{article.venue_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(article.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {article.published_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Publicado:{" "}
                              {new Date(
                                article.published_at,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <StatusChip status={article.status} size="sm" />

                      {/* Acciones */}
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => openPreview(article)}
                          className="px-2 py-1 text-xs font-medium rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Visualizar
                        </button>
                        <button
                          onClick={() => openEditModal(article)}
                          className="px-2 py-1 text-xs font-medium rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Editar
                        </button>
                        {article.status === "pending" ? (
                          <button
                            onClick={() => handleApproveArticle(article.id)}
                            className="px-2 py-1 text-xs font-medium rounded border border-green-600 text-green-700 bg-green-50 hover:bg-green-100"
                          >
                            Aprobar
                          </button>
                        ) : article.status === "published" ? (
                          <button
                            onClick={() =>
                              handleToggleStatus(article.id, article.status)
                            }
                            className="px-2 py-1 text-xs font-medium rounded border border-red-600 text-red-700 bg-red-50 hover:bg-red-100"
                          >
                            Archivar
                          </button>
                        ) : article.status === "archived" ? (
                          <button
                            onClick={() =>
                              handleToggleStatus(article.id, article.status)
                            }
                            className="px-2 py-1 text-xs font-medium rounded border border-green-600 text-green-700 bg-green-50 hover:bg-green-100"
                          >
                            Publicar
                          </button>
                        ) : null}
                        <button
                          onClick={() => openDeleteModal(article.id)}
                          className="px-2 py-1 text-xs font-medium rounded border border-red-800 text-red-800 bg-red-50 hover:bg-red-100"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </p>
              <button
                onClick={selectAllVisible}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Seleccionar página actual
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Preview Artículo */}
      {previewArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Visualizar Artículo
              </h2>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {previewArticle.featured_image_url && (
                <img
                  src={previewArticle.featured_image_url}
                  alt=""
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {previewArticle.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{previewArticle.author_name}</span>
                </div>
                {previewArticle.venue_name && (
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    <span>{previewArticle.venue_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(previewArticle.created_at).toLocaleDateString()}
                  </span>
                </div>
                <StatusChip status={previewArticle.status} size="sm" />
              </div>

              <p className="text-lg text-gray-700 mb-4 font-medium">
                {previewArticle.summary}
              </p>

              <div className="prose prose-sm max-w-none">
                <div
                  dangerouslySetInnerHTML={{
                    __html: previewArticle.content.replace(/\n/g, "<br>"),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Artículo */}
      {showArticleModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeArticleModal}
          ></div>

          {/* Modal Panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingArticle ? "Editar Artículo" : "Crear Nuevo Artículo"}
                </h2>
                <button
                  onClick={closeArticleModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <ArticleEditorForm
                  article={editingArticle}
                  onClose={closeArticleModal}
                  onArticleSaved={handleArticleSaved}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Rechazar Artículo */}
      {showRejectModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={closeRejectModal}
          ></div>

          {/* Modal Panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Rechazar Artículo
                </h2>
                <button
                  onClick={closeRejectModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Proporciona un mensaje explicando por qué se rechaza este
                  artículo. El autor verá este mensaje.
                </p>

                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Escribe tu mensaje de rechazo aquí (10-500 caracteres)..."
                  value={rejectionMessage}
                  onChange={(e) => setRejectionMessage(e.target.value)}
                  maxLength={500}
                />

                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`text-xs ${rejectionMessage.length < 10 ? "text-red-500" : rejectionMessage.length > 450 ? "text-orange-500" : "text-gray-500"}`}
                  >
                    {rejectionMessage.length}/500 caracteres{" "}
                    {rejectionMessage.length < 10 && "(mínimo 10)"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={closeRejectModal}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectArticle}
                  disabled={rejectionMessage.trim().length < 10}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar Artículo
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Eliminar Artículo (Custom Modal) */}
      {showDeleteModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowDeleteModal(false)}
          ></div>

          {/* Modal Panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Confirmar Eliminación
                </h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  ¿Estás seguro de que quieres eliminar este artículo? Esta acción es{" "}
                  <span className="font-bold text-red-600">irreversible</span>.
                </p>
                <p className="text-xs text-gray-500">
                  El artículo con ID: {deletingArticleId} será eliminado permanentemente.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteArticle}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Confirmar Eliminación
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminArticlesPage;

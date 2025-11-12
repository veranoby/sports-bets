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
  const [showArticleModal] = useState(false);
  const [editingArticle] = useState<Article | null>(null);

  // Modal preview
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  // Estados para artículos pendientes
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);

  // Funciones auxiliares que faltan
  const fetchData = async () => {
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
      setArticles((articlesRes.data as any)?.articles || []);
      setVenues((venuesRes.data as any)?.venues || []);
      // Actualizar pendientes
      setPendingArticles(
        ((articlesRes.data as any)?.articles || []).filter(
          (a: Article) => a.status === "pending",
        ) || [],
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
        setArticles((articlesRes.data as any)?.articles || []);
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
    // Aprobar artículo
    const result = await articlesAPI.update(articleId, { status: "published" });
    if (result.success) {
      fetchData(); // Refrescar lista
    }
  };

  const handleRejectArticle = async (articleId: string) => {
    // Rechazar artículo
    const result = await articlesAPI.update(articleId, { status: "archived" });
    if (result.success) {
      fetchData(); // Refrescar lista
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres eliminar este artículo? Esta acción es irreversible.",
      )
    ) {
      try {
        const result = await articlesAPI.delete(articleId);
        if (result.success) {
          fetchData(); // Refrescar lista
        } else {
          setError(result.error || "Error al eliminar artículo");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    }
  };

  const handleBulkApprove = async () => {
    // Aprobar artículos seleccionados
    const results = await Promise.all(
      selectedArticles.map((id) =>
        articlesAPI.update(id, { status: "published" }),
      ),
    );
    if (results.every((r) => r.success)) {
      setSelectedArticles([]);
      setShowBulkActions(false);
      fetchData(); // Refrescar lista
    }
  };

  const handleBulkReject = async () => {
    // Rechazar artículos seleccionados
    const results = await Promise.all(
      selectedArticles.map((id) =>
        articlesAPI.update(id, { status: "archived" }),
      ),
    );
    if (results.every((r) => r.success)) {
      setSelectedArticles([]);
      setShowBulkActions(false);
      fetchData(); // Refrescar lista
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
    // Esta función se puede implementar más adelante
  };

  const closeArticleModal = () => {
    // Esta función se puede implementar más adelante
  };

  const openEditModal = (article: Article) => {
    // Esta función se puede implementar más adelante
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
                  <h3 className="font-medium text-gray-900 truncate">
                    {article.title}
                  </h3>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPreview(article)}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleApproveArticle(article.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleRejectArticle(article.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(article.id)}
                    className="px-3 py-1 bg-red-800 text-white rounded text-sm hover:bg-red-900 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
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
            Gestión General
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
                {/* Checkbox selección */}
                <input
                  type="checkbox"
                  checked={selectedArticles.includes(article.id)}
                  onChange={() => toggleArticleSelection(article.id)}
                  className="w-4 h-4 text-blue-600"
                />

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
                      <div className="flex gap-1">
                        <button
                          onClick={() => openPreview(article)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(article)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {article.status === "published" ? (
                          <button
                            onClick={() =>
                              handleToggleStatus(article.id, article.status)
                            }
                            className="p-1 text-red-400 hover:text-red-600"
                            title="Archivar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : article.status === "archived" ? (
                          <button
                            onClick={() =>
                              handleToggleStatus(article.id, article.status)
                            }
                            className="p-1 text-green-600 hover:text-green-600"
                            title="Publicar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
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
                Preview Artículo
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
    </div>
  );
};

export default AdminArticlesPage;

// frontend/src/pages/admin/Galleras.tsx
// 🏛️ GESTIÓN GalleraS ADMIN - Layout vertical optimizado
// Secciones: Pendientes → Nuevos → Herramientas → Lista Principal + Modal Detalle

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  MapPin,
  UserPlus,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  BarChart3,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Shield,
  AlertTriangle,
  Edit,
} from "lucide-react";

// Componentes reutilizados
import Card from "../../components/shared/Card";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import EditGalleraModal from "../../components/admin/EditGalleraModal";

// APIs
import { gallerasAPI, articlesAPI, eventsAPI } from "../../config/api";

interface Gallera {
  id: string;
  name: string;
  location: string;
  description?: string;
  status: "pending" | "active" | "suspended" | "rejected";
  ownerId: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  capacity?: number;
  createdAt: string;
  owner?: {
    username: string;
    email: string;
    profileInfo?: {
      fullName?: string;
    };
  };
}

interface GalleraDetailData {
  Gallera: Gallera;
  articles: {
    total: number;
    published: number;
    pending: number;
    drafts: number;
    recent: any[];
  };
  events: {
    total: number;
    upcoming: number;
    completed: number;
    totalReGallera: number;
    recent: any[];
  };
}

const AdminGallerasPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados principales
  const [Galleras, setGalleras] = useState<Gallera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || searchParams.get("filter") || ""
  );

  // Paginación
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );
  const [pageSize] = useState(50);

  // Modal detalle
  const [selectedGalleraId, setSelectedGalleraId] = useState<string | null>(null);
  const [GalleraDetailData, setGalleraDetailData] =
    useState<GalleraDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("info");

  // Modal rechazo
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedGallera, setSelectedGallera] = useState<Gallera | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isEditGalleraModalOpen, setIsEditGalleraModalOpen] = useState(false);

  // Fetch Galleras
  const fetchGalleras = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await GallerasAPI.getAll({
        limit: 1000,
        includeOwner: true,
      });
      setGalleras(response.data?.Galleras || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading Galleras");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch detalle Gallera
  const fetchGalleraDetail = useCallback(async (GalleraId: string) => {
    try {
      setDetailLoading(true);

      const [GalleraRes, articlesRes, eventsRes] = await Promise.all([
        GallerasAPI.getById(GalleraId),
        articlesAPI.getAll({ Gallera_id: GalleraId, limit: 5 }),
        eventsAPI.getAll({ GalleraId, limit: 5 }),
      ]);

      const articles = articlesRes.data?.articles || [];
      const events = eventsRes.data?.events || [];

      setGalleraDetailData({
        Gallera: GalleraRes.data,
        articles: {
          total: articles.length,
          published: articles.filter((a) => a.status === "published").length,
          pending: articles.filter((a) => a.status === "pending").length,
          drafts: articles.filter((a) => a.status === "draft").length,
          recent: articles.slice(0, 5),
        },
        events: {
          total: events.length,
          upcoming: events.filter((e) => e.status === "upcoming").length,
          completed: events.filter((e) => e.status === "completed").length,
          totalReGallera: events.reduce(
            (sum, e) => sum + (e.totalPrizePool || 0),
            0
          ),
          recent: events.slice(0, 5),
        },
      });
    } catch (err) {
      console.error("Error loading Gallera detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Filtrado y paginación
  const { pendingGalleras, newGallerasThisWeek, filteredGalleras, totalPages } =
    useMemo(() => {
      let result = [...Galleras];

      // Galleras pendientes
      const pending = result.filter((v) => v.status === "pending");

      // Nuevos esta semana
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const newGalleras = result
        .filter(
          (v) => new Date(v.createdAt) >= weekAgo && v.status !== "pending"
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 20);

      // Aplicar filtros
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(
          (v) =>
            v.name.toLowerCase().includes(term) ||
            v.location.toLowerCase().includes(term) ||
            v.owner?.username.toLowerCase().includes(term)
        );
      }

      if (statusFilter) {
        result = result.filter((v) => v.status === statusFilter);
      }

      const total = Math.ceil(result.length / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedGalleras = result.slice(startIndex, startIndex + pageSize);

      return {
        pendingGalleras: pending,
        newGallerasThisWeek: newGalleras,
        filteredGalleras: paginatedGalleras,
        totalPages: total,
      };
    }, [Galleras, searchTerm, statusFilter, currentPage, pageSize]);

  // Actualizar URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (statusFilter) params.set("status", statusFilter);
    if (currentPage > 1) params.set("page", currentPage.toString());

    setSearchParams(params);
  }, [searchTerm, statusFilter, currentPage, setSearchParams]);

  // Acciones
  const handleApproveGallera = async (GalleraId: string) => {
    try {
      await GallerasAPI.updateStatus(GalleraId, "active");
      setGalleras(
        Galleras.map((v) => (v.id === GalleraId ? { ...v, status: "active" } : v))
      );
    } catch (err) {
      setError("Error al aprobar Gallera");
    }
  };

  const openRejectModal = (Gallera: Gallera) => {
    setSelectedGallera(Gallera);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectGallera = async () => {
    if (!selectedGallera) return;

    try {
      await GallerasAPI.updateStatus(
        selectedGallera.id,
        "rejected",
        rejectionReason
      );
      setGalleras(
        Galleras.map((v) =>
          v.id === selectedGallera.id ? { ...v, status: "rejected" } : v
        )
      );
      setShowRejectModal(false);
    } catch (err) {
      setError("Error al rechazar Gallera");
    }
  };

  const handleToggleStatus = async (GalleraId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "suspended" : "active";
      await GallerasAPI.updateStatus(GalleraId, newStatus);
      setGalleras(
        Galleras.map((v) => (v.id === GalleraId ? { ...v, status: newStatus } : v))
      );
    } catch (err) {
      setError("Error al cambiar estado");
    }
  };

  const handleGalleraUpdated = (updatedGallera: Gallera) => {
    setGalleras(
      Galleras.map((v) => (v.id === updatedGallera.id ? updatedGallera : v))
    );
    if (GalleraDetailData && GalleraDetailData.Gallera.id === updatedGallera.id) {
      setGalleraDetailData({
        ...GalleraDetailData,
        Gallera: updatedGallera,
      });
    }
    setIsEditGalleraModalOpen(false);
  };

  const openGalleraDetail = (GalleraId: string) => {
    setSelectedGalleraId(GalleraId);
    fetchGalleraDetail(GalleraId);
  };

  const closeGalleraDetail = () => {
    setSelectedGalleraId(null);
    setGalleraDetailData(null);
    setActiveDetailTab("info");
  };

  // Fetch inicial
  useEffect(() => {
    fetchGalleras();
  }, [fetchGalleras]);

  // Componentes auxiliares
  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      suspended: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors] || colors.pending
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Cargando Galleras..." />;
  }

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Galleras</h1>
        <p className="text-gray-600">{Galleras.length} galleras totales</p>
      </div>

      {error && (
        <ErrorMessage error={error} onRetry={fetchGalleras} className="mb-6" />
      )}

      {/* Sección 1: Pendientes Aprobación */}
      {pendingGalleras.length > 0 && (
        <Card className="mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🟡 Galleras Pendientes de Aprobación ({pendingGalleras.length})
          </h2>
          <div className="space-y-4">
            {pendingGalleras.map((Gallera) => (
              <div
                key={Gallera.id}
                className="flex items-start justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-yellow-200 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{Gallera.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{Gallera.location}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Propietario: {Gallera.owner?.username} ({Gallera.owner?.email}
                      )
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Solicitado:{" "}
                      {new Date(Gallera.createdAt).toLocaleDateString()}
                    </p>
                    {Gallera.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {Gallera.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleApproveGallera(Gallera.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => openRejectModal(Gallera)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    Rechazar
                  </button>
                  <button
                    onClick={() => openGalleraDetail(Gallera.id)}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sección 2: Nuevos Esta Semana */}
      {newGallerasThisWeek.length > 0 && (
        <Card className="mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🆕 Nuevos Esta Semana ({newGallerasThisWeek.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {newGallerasThisWeek.map((Gallera) => (
              <div
                key={Gallera.id}
                className="p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-200 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {Gallera.name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {Gallera.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge status={Gallera.status} />
                  <button
                    onClick={() => openGalleraDetail(Gallera.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sección 3: Herramientas */}
      <Card className="mb-6 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, ubicación o propietario..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtros */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="suspended">Suspendidos</option>
              <option value="pending">Pendientes</option>
              <option value="rejected">Rechazados</option>
            </select>
          </div>

          <button
            onClick={() => navigate("/admin/Galleras/create")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Crear Gallera
          </button>
        </div>
      </Card>

      {/* Sección 4: Lista Principal */}
      <Card color="white" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Galleras ({filteredGalleras.length})
          </h2>
          {(searchTerm || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setCurrentPage(1);
              }}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto ">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gallera
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propietario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className=" divide-y divide-gray-200">
              {filteredGalleras.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No se encontraron Galleras con los filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredGalleras.map((Gallera) => (
                  <tr key={Gallera.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {Gallera.name}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {Gallera.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {Gallera.owner?.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          {Gallera.owner?.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={Gallera.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {Gallera.contactInfo?.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{Gallera.contactInfo.email}</span>
                          </div>
                        )}
                        {Gallera.contactInfo?.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{Gallera.contactInfo.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(Gallera.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openGalleraDetail(Gallera.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                        {Gallera.status === "active" ? (
                          <button
                            onClick={() =>
                              handleToggleStatus(Gallera.id, Gallera.status)
                            }
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Suspender
                          </button>
                        ) : Gallera.status === "suspended" ? (
                          <button
                            onClick={() =>
                              handleToggleStatus(Gallera.id, Gallera.status)
                            }
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Activar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </p>
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

      {/* Modal Detalle Gallera */}
      {selectedGalleraId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalle de Gallera
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsEditGalleraModalOpen(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={closeGalleraDetail}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                {[
                  { id: "info", label: "Información General" },
                  { id: "articles", label: "Noticias" },
                  { id: "events", label: "Eventos" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 ${
                      activeDetailTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {detailLoading ? (
                <LoadingSpinner text="Cargando detalle..." />
              ) : GalleraDetailData ? (
                <>
                  {/* Tab Info General */}
                  {activeDetailTab === "info" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Información de la Gallera
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Nombre
                              </label>
                              <p className="text-sm text-gray-900">
                                {GalleraDetailData.Gallera.name}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Ubicación
                              </label>
                              <p className="text-sm text-gray-900">
                                {GalleraDetailData.Gallera.location}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Descripción
                              </label>
                              <p className="text-sm text-gray-900">
                                {GalleraDetailData.Gallera.description ||
                                  "No especificada"}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Capacidad
                              </label>
                              <p className="text-sm text-gray-900">
                                {GalleraDetailData.Gallera.capacity
                                  ? `${GalleraDetailData.Gallera.capacity} personas`
                                  : "No especificada"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Información del Propietario
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Username
                              </label>
                              <p className="text-sm text-gray-900">
                                {GalleraDetailData.Gallera.owner?.username}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Email
                              </label>
                              <p className="text-sm text-gray-900">
                                {GalleraDetailData.Gallera.owner?.email}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Estado
                              </label>
                              <StatusBadge
                                status={GalleraDetailData.Gallera.status}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500">
                                Fecha de Registro
                              </label>
                              <p className="text-sm text-gray-900">
                                {new Date(
                                  GalleraDetailData.Gallera.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Información de Contacto */}
                          {GalleraDetailData.Gallera.contactInfo && (
                            <div className="mt-6">
                              <h4 className="text-md font-medium text-gray-900 mb-3">
                                Información de Contacto
                              </h4>
                              <div className="space-y-2">
                                {GalleraDetailData.Gallera.contactInfo.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-900">
                                      {GalleraDetailData.Gallera.contactInfo.email}
                                    </span>
                                  </div>
                                )}
                                {GalleraDetailData.Gallera.contactInfo.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-900">
                                      {GalleraDetailData.Gallera.contactInfo.phone}
                                    </span>
                                  </div>
                                )}
                                {GalleraDetailData.Gallera.contactInfo.address && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-900">
                                      {
                                        GalleraDetailData.Gallera.contactInfo
                                          .address
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab Noticias */}
                  {activeDetailTab === "articles" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card
                          variant="stat"
                          title="Total Artículos"
                          value={GalleraDetailData.articles.total}
                          color="blue"
                        />
                        <Card
                          variant="stat"
                          title="Publicados"
                          value={GalleraDetailData.articles.published}
                          color="green"
                        />
                        <Card
                          variant="stat"
                          title="Pendientes"
                          value={GalleraDetailData.articles.pending}
                          color="yellow"
                        />
                        <Card
                          variant="stat"
                          title="Borradores"
                          value={GalleraDetailData.articles.drafts}
                          color="gray"
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Artículos Recientes
                        </h3>
                        <div className="space-y-3">
                          {GalleraDetailData.articles.recent.length > 0 ? (
                            GalleraDetailData.articles.recent.map(
                              (article, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {article.title}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(
                                        article.created_at
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <StatusBadge status={article.status} />
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-gray-500">
                              No hay artículos creados
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab Eventos */}
                  {activeDetailTab === "events" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card
                          variant="stat"
                          title="Total Eventos"
                          value={GalleraDetailData.events.total}
                          color="blue"
                        />
                        <Card
                          variant="stat"
                          title="Próximos"
                          value={GalleraDetailData.events.upcoming}
                          color="yellow"
                        />
                        <Card
                          variant="stat"
                          title="Completados"
                          value={GalleraDetailData.events.completed}
                          color="green"
                        />
                        <Card
                          variant="stat"
                          title="Ingresos Totales"
                          value={`$${GalleraDetailData.events.totalReGallera.toLocaleString()}`}
                          color="purple"
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Eventos Recientes
                        </h3>
                        <div className="space-y-3">
                          {GalleraDetailData.events.recent.length > 0 ? (
                            GalleraDetailData.events.recent.map(
                              (event, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {event.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(
                                        event.scheduledDate
                                      ).toLocaleDateString()}{" "}
                                      - {event.totalFights} peleas
                                    </p>
                                  </div>
                                  <StatusBadge status={event.status} />
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-gray-500">
                              No hay eventos registrados
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">
                  Error al cargar los datos del Gallera
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazo */}
      {showRejectModal && selectedGallera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Rechazar Gallera
                  </h3>
                  <p className="text-sm text-gray-600">{selectedGallera.name}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del rechazo (opcional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe el motivo del rechazo..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectGallera}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditGalleraModalOpen && GalleraDetailData && (
        <EditGalleraModal
          Gallera={GalleraDetailData.Gallera}
          onClose={() => setIsEditGalleraModalOpen(false)}
          onGalleraUpdated={handleGalleraUpdated}
        />
      )}
    </div>
  );
};

export default AdminGallerasPage;

import React, { useState, useEffect, Fragment } from "react";
import {
  ShieldCheck,
  XCircle,
  Clock,
  Upload,
  Info,
  FileText,
  CheckCircle,
} from "lucide-react";
import { membershipRequestsAPI, uploadsAPI } from "../../services/api";
import type { User } from "../../types";

interface Subscription {
  manual_expires_at?: string | null;
  membership_type?: string | null;
  status?: "active" | "expired" | "pending" | null;
}

interface MembershipSectionProps {
  subscription: Subscription | null | undefined;
  user: User | null;
}

const statusConfig = {
  active: {
    icon: <ShieldCheck className="w-5 h-5 text-green-500" />,
    label: "Activa",
    textColor: "text-green-700",
    bgColor: "bg-green-100",
  },
  expired: {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    label: "Expirada",
    textColor: "text-red-700",
    bgColor: "bg-red-100",
  },
  pending: {
    icon: <Clock className="w-5 h-5 text-yellow-500" />,
    label: "Pendiente",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
};

const BankInfo = () => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
      <Info className="w-5 h-5 mr-2 text-blue-600" />
      Información para Transferencia Bancaria
    </h4>
    <p className="text-sm text-gray-600 mb-4">
      Realiza tu depósito o transferencia a la siguiente cuenta:
    </p>
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <div className="font-medium text-gray-500">Banco:</div>
      <div className="text-gray-800">Banco Pichincha</div>
      <div className="font-medium text-gray-500">Tipo de Cuenta:</div>
      <div className="text-gray-800">Corriente</div>
      <div className="font-medium text-gray-500">Número de Cuenta:</div>
      <div className="text-gray-800">2100123456</div>
      <div className="font-medium text-gray-500">Beneficiario:</div>
      <div className="text-gray-800">GalloBets S.A.</div>
      <div className="font-medium text-gray-500">RUC:</div>
      <div className="text-gray-800">1792345678001</div>
    </div>
    <p className="text-xs text-gray-500 mt-4">
      Luego de realizar la transferencia, puedes subir tu comprobante
      (opcional).
    </p>
  </div>
);

// Membership plan details
const membershipPlans = {
  free: {
    name: "Gratis",
    price: "$0",
    duration: "Permanente",
    features: [
      "Acceso limitado a contenido público",
      "Sin acceso a eventos en vivo",
      "Sin acceso a apuestas",
    ],
  },
  "24-hour": {
    name: "24 Horas",
    price: "$5",
    duration: "1 día",
    features: [
      "Acceso completo a eventos en vivo por 24 horas",
      "Acceso a sistema de apuestas P2P",
      "Visualización de todas las peleas del día",
      "Sin renovación automática",
    ],
  },
  monthly: {
    name: "Mensual",
    price: "$10",
    duration: "30 días",
    features: [
      "Acceso ilimitado a todos los eventos del mes",
      "Acceso prioritario a apuestas P2P",
      "Historial completo de peleas",
      "Descuentos en eventos especiales",
      "Renovación automática opcional",
    ],
  },
};

const RequestChangeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onRequestCreated?: () => void;
}> = ({ isOpen, onClose, user, onRequestCreated }) => {
  const [requestedMembershipType, setRequestedMembershipType] =
    useState("24-hour");
  const [requestNotes, setRequestNotes] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic validation
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("El comprobante debe ser una imagen válida (JPG, PNG o WebP)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        setError("El archivo no puede exceder los 5MB.");
        return;
      }
      setPaymentProof(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user.profileInfo?.phoneNumber) {
      setError(
        "Debes tener un número de teléfono registrado en tu perfil para solicitar cambios de membresía",
      );
      return;
    }

    setLoading(true);
    let paymentProofUrl: string | undefined = undefined;

    try {
      // Step 1: Upload payment proof if it exists
      if (paymentProof) {
        const uploadResponse = await uploadsAPI.uploadImage(paymentProof);
        if (uploadResponse.success && uploadResponse.data) {
          paymentProofUrl = uploadResponse.data.url;
        } else {
          throw new Error(
            uploadResponse.error ||
              "Error al subir el comprobante. Intenta de nuevo",
          );
        }
      }

      // Step 2: Create the membership change request
      const requestData = {
        requestedMembershipType,
        requestNotes,
        paymentProofUrl,
      };

      const response = await membershipRequestsAPI.createRequest(requestData);

      if (response.success) {
        setSuccess("Solicitud de cambio de membresía enviada correctamente.");
        // Refresh the requests list immediately
        if (onRequestCreated) {
          onRequestCreated();
        }
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 3000);
      } else {
        throw new Error(
          response.error || "Ocurrió un error al crear la solicitud.",
        );
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error desconocido.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-blue-50 rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Solicitar Cambio de Membresía
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <BankInfo />

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="membership_type"
                className="block text-sm font-medium text-gray-700 mb-3"
              >
                Selecciona tu Plan
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {(["24-hour", "monthly"] as const).map((planKey) => {
                  const plan = membershipPlans[planKey];
                  const isSelected = requestedMembershipType === planKey;
                  return (
                    <button
                      key={planKey}
                      type="button"
                      onClick={() => setRequestedMembershipType(planKey)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg text-gray-900">
                          {plan.name}
                        </h4>
                        <span className="text-2xl font-bold text-blue-600">
                          {plan.price}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Duración: {plan.duration}
                      </p>
                      <ul className="space-y-1">
                        {plan.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-gray-700 flex items-start"
                          >
                            <span className="text-green-500 mr-2">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              {/* Comparison with free plan */}
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                <h5 className="font-semibold text-sm text-gray-800 mb-2">
                  Plan Gratis (Predeterminado)
                </h5>
                <ul className="space-y-1">
                  {membershipPlans.free.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-gray-600 flex items-start"
                    >
                      <span className="text-red-500 mr-2">✗</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  Si tu membresía expira o cancelas, volverás automáticamente al
                  plan gratis
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="request_notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Motivo de la Solicitud (opcional)
              </label>
              <textarea
                id="request_notes"
                rows={3}
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Realicé el pago para la membresía VIP..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprobante de Pago (opcional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-blue-50 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Sube un archivo</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </label>
                    <p className="pl-1">o arrástralo aquí</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WEBP hasta 5MB
                  </p>
                  {paymentProof && (
                    <p className="text-sm text-green-600 mt-2">
                      Archivo seleccionado: {paymentProof.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-600 bg-red-100 p-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 text-green-600 bg-green-100 p-3 rounded-lg">
              {success}
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar Solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MembershipSection: React.FC<MembershipSectionProps> = ({
  subscription,
  user,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const currentStatus = subscription?.status || "expired";
  const config = statusConfig[currentStatus];

  const expirationDate = subscription?.manual_expires_at
    ? new Date(subscription.manual_expires_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  // Fetch user's request history
  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await membershipRequestsAPI.getMyRequests();
      if (response.success && response.data) {
        setRequests((response.data as any).requests || []);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        color: "bg-yellow-100 text-yellow-700",
        icon: <Clock className="w-4 h-4" />,
        label: "Pendiente",
      },
      completed: {
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Aprobada",
      },
      rejected: {
        color: "bg-red-100 text-red-700",
        icon: <XCircle className="w-4 h-4" />,
        label: "Rechazada",
      },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  return (
    <Fragment>
      <div className="bg-blue-50 rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Gestión de Membresía
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Plan Actual
            </label>
            <p className="text-lg font-semibold text-gray-800">
              {subscription?.membership_type || "Ninguno"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Estado
            </label>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}
            >
              {config.icon}
              {config.label}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Fecha de Expiración
            </label>
            <p className="text-lg font-semibold text-gray-800">
              {expirationDate}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Solicitar Cambio de Membresía
          </button>
          <p className="text-sm text-gray-500">
            Nota: Todos los cambios de membresía requieren aprobación de un
            administrador.
          </p>
        </div>
      </div>

      {/* Historial de Solicitudes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Solicitudes
          </h3>
        </div>

        {loadingRequests ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tienes solicitudes de cambio de membresía
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Membresía Solicitada
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request: any) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(request.requestedAt).toLocaleDateString(
                        "es-ES",
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {request.requestedMembershipType === "24-hour"
                        ? "24 Horas"
                        : "Mensual"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {request.status === "rejected" &&
                      request.rejectionReason ? (
                        <div className="text-red-600">
                          <strong>Motivo de rechazo:</strong>{" "}
                          {request.rejectionReason}
                        </div>
                      ) : request.status === "completed" ? (
                        <span className="text-green-600">
                          Procesada el{" "}
                          {new Date(request.processedAt).toLocaleDateString(
                            "es-ES",
                          )}
                        </span>
                      ) : (
                        <span className="text-yellow-600">En revisión</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {user && (
        <RequestChangeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={user}
          onRequestCreated={fetchRequests}
        />
      )}
    </Fragment>
  );
};

export default MembershipSection;

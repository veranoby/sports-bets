// frontend/src/pages/admin/CreateEvent.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { eventsAPI, usersAPI } from "../../config/api";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import Card from "../../components/shared/Card";
import { ArrowLeft, HelpCircle } from "lucide-react";

interface Venue {
  id: string;
  name: string;
  location?: string;
}

interface Operator {
  id: string;
  username: string;
}

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [name, setName] = useState("");
  const [venueId, setVenueId] = useState("");
  const [scheduledDateDate, setScheduledDateDate] = useState("");
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [operatorId, setOperatorId] = useState<string | null>(null);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Obtener galleras y operadores en paralelo
        const [venuesRes, operatorsRes] = await Promise.all([
          usersAPI.getAll({
            role: "venue",
            isActive: true,
            limit: 1000,
          }),
          usersAPI.getOperators().catch(() => ({ data: { users: [] } })), // Handle potential error gracefully
        ]);

        // Normalizar datos de galleras
        const venuesData = Array.isArray(venuesRes.data.users)
          ? venuesRes.data.users.map((user) => ({
              id: user.id,
              name: user.profileInfo?.venueName || user.username,
              location: user.profileInfo?.venueLocation || "",
            }))
          : [];

        setVenues(venuesData);

        // Extraer operadores
        let operatorsData = Array.isArray(operatorsRes.data.users)
          ? operatorsRes.data.users
          : [];

        // Si el usuario actual es admin, incluirlo en la lista de operadores
        if (currentUser && currentUser.role === "admin") {
          const adminInList = operatorsData.find(
            (op) => op.id === currentUser.id,
          );
          if (!adminInList) {
            operatorsData = [
              { id: currentUser.id, username: currentUser.username },
              ...operatorsData,
            ];
          }
        }

        setOperators(operatorsData);

        // Usar operador actual por defecto si aplica
        if (
          currentUser &&
          (currentUser.role === "admin" || currentUser.role === "operator")
        ) {
          setOperatorId(currentUser.id);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("No se pudo cargar la información. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const scheduledDate =
    scheduledDateDate && scheduledDateTime
      ? `${scheduledDateDate}T${scheduledDateTime}:00`
      : "";

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "El nombre del evento es obligatorio";
    }

    if (!venueId) {
      errors.venueId = "Selecciona un estadio o coliseo";
    }

    if (!scheduledDate) {
      errors.scheduledDate = "La fecha y hora son obligatorias";
    } else {
      const selectedDate = new Date(scheduledDate);
      const now = new Date();
      if (selectedDate <= now) {
        errors.scheduledDate = "La fecha debe estar en el futuro";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const eventData: {
        name: string;
        venueId: string;
        scheduledDate: string;
        operatorId?: string;
      } = {
        name,
        venueId,
        scheduledDate,
      };

      // Only include operatorId if it has a valid value
      if (operatorId && operatorId.trim()) {
        eventData.operatorId = operatorId;
      }

      await eventsAPI.create(eventData);
      navigate("/admin/events");
    } catch {
      setError("No se pudo crear el evento. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/events")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Eventos
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Crear nuevo Evento
          </h1>
        </div>

        {error && <ErrorMessage message={error} className="mb-6" />}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Name */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Evento *
                </label>
                <div className="relative group">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded p-2 z-10">
                    Ingresa un nombre claro para el evento (ej. "Pelea de Gallos
                    - Viernes 6 Oct").
                  </div>
                </div>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Introduce el nombre del evento"
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Venue Selection */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estadio/Coliseo *
                </label>
                <div className="relative group">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded p-2 z-10">
                    Selecciona la gallera donde se realizará la jornada.
                  </div>
                </div>
              </div>
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.venueId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Selecciona un estadio o coliseo</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
              {formErrors.venueId && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.venueId}
                </p>
              )}
            </div>

            {/* Scheduled Date */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha y hora programada *
                </label>
                <div className="relative group">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded p-2 z-10">
                    Selecciona la fecha y hora de inicio. Debe ser posterior al
                    momento actual.
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={scheduledDateDate}
                    onChange={(e) => setScheduledDateDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.scheduledDate
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.scheduledDate
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
              </div>
              {formErrors.scheduledDate && (
                <p className="text-red-500 text-sm mt-2">
                  {formErrors.scheduledDate}
                </p>
              )}
            </div>

            {/* Operator Selection */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operador
                </label>
                <div className="relative group">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded p-2 z-10">
                    Selecciona el operador responsable. Si lo dejas vacío, tú
                    serás asignado automáticamente.
                  </div>
                </div>
              </div>
              <select
                value={operatorId || ""}
                onChange={(e) => setOperatorId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona un operador (opcional)</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {typeof operator.username === "string"
                      ? operator.username
                      : typeof operator === "object" && operator.username
                        ? operator.username
                        : "Operador desconocido"}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">
                Selecciona el operador responsable. Si lo dejas vacío, se te
                asignará automáticamente.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/admin/events")}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creando..." : "Crear evento"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateEvent;

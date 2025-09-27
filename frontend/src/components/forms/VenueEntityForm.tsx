// frontend/src/components/forms/VenueEntityForm.tsx
// Formulario para editar información específica de la entidad Venue

import React, { useState } from "react";
import { venuesAPI } from "../../services/api";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import { MapPin, Building2, Phone, Mail } from "lucide-react";
import type { Venue } from "../../types";

interface VenueEntityFormProps {
  venue?: Venue;
  userId: string;
  onSave: (venueData: Venue) => void;
  onCancel: () => void;
}

const VenueEntityForm: React.FC<VenueEntityFormProps> = ({
  venue,
  userId,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<Venue>>({
    name: venue?.name || "",
    location: venue?.location || "",
    description: venue?.description || "",
    contactInfo: venue?.contactInfo || {
      phone: "",
      email: "",
      website: "",
      address: "",
    },
    images: venue?.images || [],
    status: venue?.status || "pending",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("contactInfo.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result: Venue;
      if (venue?.id) {
        // Para actualizaciones, no pasamos ownerId
        const response = await venuesAPI.update(venue.id, formData);
        result = response.data as Venue;
      } else {
        // Para creaciones, sí pasamos ownerId
        const response = await venuesAPI.create({
          name: formData.name || "New Venue",
          location: formData.location || "Location TBD",
          description: formData.description,
          ownerId: userId,
          contactInfo: formData.contactInfo,
        });
        result = response.data as Venue;
      }
      onSave(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar la entidad",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          {venue?.id
            ? "Editar Información de la Entidad"
            : "Crear Información de la Entidad"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Entidad
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            Ubicación
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Teléfono
            </label>
            <input
              type="tel"
              name="contactInfo.phone"
              value={formData.contactInfo.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              name="contactInfo.email"
              value={formData.contactInfo.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sitio Web
          </label>
          <input
            type="url"
            name="contactInfo.website"
            value={formData.contactInfo.website}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección Completa
          </label>
          <input
            type="text"
            name="contactInfo.address"
            value={formData.contactInfo.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pending">Pendiente</option>
            <option value="active">Activo</option>
            <option value="suspended">Suspendido</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>

        {error && <ErrorMessage error={error} />}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Guardando...
              </>
            ) : (
              "Guardar Entidad"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VenueEntityForm;

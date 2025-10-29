import React, { useState } from "react";
import { gallerasAPI } from "../../services/api";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import ImageGalleryUpload from "../shared/ImageGalleryUpload";
import {
  MapPin,
  Trophy,
  Users,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import type { Gallera } from "../../types";

interface GalleraEntityFormProps {
  gallera?: Gallera;
  userId: string;
  onSave: (galleraData: Gallera) => void;
  onCancel: () => void;
}

const GalleraEntityForm: React.FC<GalleraEntityFormProps> = ({
  gallera,
  userId,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<Gallera>>({
    name: gallera?.name || "",
    location: gallera?.location || "",
    description: gallera?.description || "",
    contactInfo: gallera?.contactInfo || {
      email: "",
      phone: "",
      website: "",
      address: "",
    },
    specialties: gallera?.specialties || {
      breeds: [],
      trainingMethods: [],
      experience: "",
    },
    activeRoosters: gallera?.activeRoosters || 0,
    fightRecord: gallera?.fightRecord || {
      wins: 0,
      losses: 0,
      draws: 0,
    },
    images: gallera?.images || [],
    status: gallera?.status || "pending",
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
          ...(prev.contactInfo as Partial<Gallera["contactInfo"]>),
          [field]: value,
        },
      }));
    } else if (name.startsWith("specialties.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        specialties: {
          ...(prev.specialties as Partial<Gallera["specialties"]>),
          [field]: value,
        },
      }));
    } else if (name.startsWith("fightRecord.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        fightRecord: {
          ...(prev.fightRecord as Partial<Gallera["fightRecord"]>),
          [field]: parseInt(value) || 0,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "activeRoosters" ? parseInt(value) || 0 : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const finalFormData = { ...formData };

      let result: Gallera;
      if (gallera?.id) {
        const response = await gallerasAPI.update(gallera.id, finalFormData);
        result = response.data as Gallera;
      } else {
        const response = await gallerasAPI.create({
          ...finalFormData,
          name: finalFormData.name || "New Gallera",
          location: finalFormData.location || "Location TBD",
          ownerId: userId,
        });
        result = response.data as Gallera;
      }
      onSave(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar la gallera",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 rounded-lg shadow-sm border p-6 border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🐓</span>
        <h3 className="text-lg font-semibold text-gray-800">
          {gallera?.id
            ? "Editar Información de la Gallera"
            : "Crear Información de la Gallera"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Gallera
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
            Descripción y Especialidad de Cría
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe la especialidad, métodos de cría, y experiencia de tu gallera..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Gallos Activos
            </label>
            <input
              type="number"
              name="activeRoosters"
              value={formData.activeRoosters}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nivel de Experiencia
            </label>
            <input
              type="text"
              name="specialties.experience"
              value={formData.specialties?.experience}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ej. 10+ años"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Récord de Peleas
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Victorias
              </label>
              <input
                type="number"
                name="fightRecord.wins"
                value={formData.fightRecord?.wins}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Derrotas
              </label>
              <input
                type="number"
                name="fightRecord.losses"
                value={formData.fightRecord?.losses}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tablas
              </label>
              <input
                type="number"
                name="fightRecord.draws"
                value={formData.fightRecord?.draws}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold text-gray-700 mb-3">
            Información de Contacto
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                name="contactInfo.email"
                value={formData.contactInfo?.email || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="contacto@gallera.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                name="contactInfo.phone"
                value={formData.contactInfo?.phone || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+593 99 999 9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Globe className="w-4 h-4 inline mr-1" />
                Sitio Web
              </label>
              <input
                type="url"
                name="contactInfo.website"
                value={formData.contactInfo?.website || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://www.gallera.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Dirección Completa
              </label>
              <input
                type="text"
                name="contactInfo.address"
                value={formData.contactInfo?.address || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Calle principal, sector..."
              />
            </div>
          </div>
        </div>

        {/* Gallery Upload Section */}
        <div className="border-t pt-4">
          <ImageGalleryUpload
            images={formData.images || []}
            onImagesChange={(images) =>
              setFormData((prev) => ({ ...prev, images }))
            }
            maxImages={10}
            label="Galería de Imágenes de la Gallera"
          />
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Guardando...
              </>
            ) : (
              "Guardar Gallera"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GalleraEntityForm;

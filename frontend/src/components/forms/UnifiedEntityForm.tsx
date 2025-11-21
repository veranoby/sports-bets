// frontend/src/components/forms/UnifiedEntityForm.tsx
// 🏛️ UNIFICACIÓN DE FORMULARIOS EMPRESA - FASE 5 COMPATIBLE
// Reemplaza VenueEntityForm.tsx y GalleraEntityForm.tsx con un único componente configurable

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../services/api";
import ImageGalleryUpload from "../shared/ImageGalleryUpload";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import { MapPin, Building, Mail, Globe, Image, Loader2, X } from "lucide-react";
import type { User } from "../../types";

interface UnifiedEntityFormProps {
  entityType: "venue" | "gallera";
  userId: string;
  initialData?: Record<string, any>;
  onSuccess: (updatedUser: User) => void;
  onCancel: () => void;
}

const UnifiedEntityForm: React.FC<UnifiedEntityFormProps> = ({
  entityType,
  userId,
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    // Common fields
    businessName:
      initialData?.businessName || initialData?.[`${entityType}Name`] || "",
    location:
      initialData?.location || initialData?.[`${entityType}Location`] || "",
    description:
      initialData?.description ||
      initialData?.[`${entityType}Description`] ||
      "",
    email: initialData?.email || initialData?.[`${entityType}Email`] || "",
    website:
      initialData?.website || initialData?.[`${entityType}Website`] || "",
    images: initialData?.images || [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (images: string[]) => {
    setFormData((prev) => ({
      ...prev,
      images,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare profileInfo data structure based on entity type
      const profileInfoUpdate: Record<string, any> = {
        // Common fields (always present)
        businessName: formData.businessName,
        location: formData.location,
        description: formData.description,
        email: formData.email,
        website: formData.website,
        // Entity-specific fields
        ...{
          [`${entityType}Name`]: formData.businessName,
          [`${entityType}Location`]: formData.location,
          [`${entityType}Description`]: formData.description,
          [`${entityType}Email`]: formData.email,
          [`${entityType}Website`]: formData.website,
        },
        // Images
        images: formData.images,
      };

      // Use correct endpoint: updateProfile for own profile, updateProfileInfo for admin editing others
      const response = await userAPI.updateProfile({
        profileInfo: profileInfoUpdate,
      });

      if (response.success) {
        // Fetch complete user data after profile update
        const fullUserResponse = await userAPI.getById(userId);
        if (fullUserResponse.success && fullUserResponse.data) {
          onSuccess(fullUserResponse.data as User);
        } else {
          throw new Error("Could not retrieve updated user information");
        }
      } else {
        throw new Error(response.error || "Error al actualizar la información");
      }
    } catch (err: any) {
      setError(err.message || "Error al actualizar la información");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {entityType === "venue"
            ? "Información de la Gallera"
            : "Información del Criadero"}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && <ErrorMessage error={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {entityType === "venue"
              ? "Nombre de la Gallera"
              : "Nombre del Criadero"}
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={
                entityType === "venue"
                  ? "Nombre de la gallera de eventos"
                  : "Nombre del criadero"
              }
              required
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ubicación
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ciudad, provincia o dirección"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={
              entityType === "venue"
                ? "Descripción de la gallera de eventos y servicios ofrecidos"
                : "Descripción del criadero y especialidades"
            }
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sitio Web
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://sitio-web.com"
            />
          </div>
        </div>

        {/* Image Gallery Upload */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Image className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">
              Galería de Imágenes
            </label>
          </div>

          <ImageGalleryUpload
            images={formData.images || []}
            onImagesChange={handleImageChange}
            maxImages={entityType === "gallera" ? 3 : 2} // Galleras: max 3 images, Venues: max 2 images
            label={`Galería de Imágenes ${entityType === "gallera" ? "del Criadero" : "de la Gallera"}`}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Información"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UnifiedEntityForm;

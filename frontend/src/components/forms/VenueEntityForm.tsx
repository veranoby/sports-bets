// frontend/src/components/forms/VenueEntityForm.tsx
// Formulario para editar información específica de la entidad Venue

import React, { useState, useRef } from "react";
import { venuesAPI, uploadsAPI } from "../../services/api";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import { MapPin, Building2, Phone, Mail, Camera, X } from "lucide-react";
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
  const [imageError, setImageError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      setImageError("Tipo de archivo no válido. Solo se permiten imágenes.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("La imagen es muy grande. Máximo 5MB.");
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      images: [],
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
          ...(prev.contactInfo as Partial<Venue["contactInfo"]>),
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
      let finalImageUrls = formData.images || [];

      // Upload new image if selected
      if (imageFile) {
        const uploadResponse = await uploadsAPI.uploadImage(imageFile);
        if (uploadResponse.success && uploadResponse.data?.url) {
          finalImageUrls = [uploadResponse.data.url]; // Replace with new image
        } else {
          throw new Error(
            uploadResponse.error || "Error al subir la imagen del venue",
          );
        }
      }

      const finalFormData = { ...formData, images: finalImageUrls };

      let result: Venue;
      if (venue?.id) {
        const response = await venuesAPI.update(venue.id, finalFormData);
        result = response.data as Venue;
      } else {
        const response = await venuesAPI.create({
          ...finalFormData,
          name: finalFormData.name || "New Venue",
          location: finalFormData.location || "Location TBD",
          ownerId: userId,
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
    <div className="bg-blue-50 rounded-lg shadow-sm border p-6 border-gray-100">
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
              value={formData.contactInfo?.phone}
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
              value={formData.contactInfo?.email}
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
            value={formData.contactInfo?.website}
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
            value={formData.contactInfo?.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Image Upload Section - Single Image */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen Principal del Venue
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {imagePreview || (formData.images && formData.images[0]) ? (
                <img
                  src={imagePreview || formData.images[0]}
                  alt="Venue preview"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              )}
              {(imagePreview || imageFile) && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="venue-image-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                <Camera className="w-4 h-4" />
                {imagePreview || (formData.images && formData.images[0])
                  ? "Cambiar imagen"
                  : "Subir imagen"}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG o WebP. Máximo 5MB.
              </p>
              {imageError && (
                <p className="text-red-500 text-xs mt-1">{imageError}</p>
              )}
            </div>
          </div>
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
              "Guardar Entidad"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VenueEntityForm;

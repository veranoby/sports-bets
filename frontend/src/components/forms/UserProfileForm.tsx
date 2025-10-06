import React, { useState, useRef } from "react";
import { userAPI, uploadsAPI } from "../../services/api";
import { Camera, X } from "lucide-react";
import LoadingSpinner from "../shared/LoadingSpinner";
import type { User } from "../../types";

interface UserProfileFormProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
  onCancel: () => void;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({
  user,
  onUpdate,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    fullName: user.profileInfo?.fullName || "",
    phoneNumber: user.profileInfo?.phoneNumber || "",
    address: user.profileInfo?.address || "",
    identificationNumber: user.profileInfo?.identificationNumber || "",
    profileImage: user.profileInfo?.profileImage || "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName?.trim()) {
      newErrors.fullName = "El nombre completo es requerido";
    }

    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = "El número de teléfono es requerido";
    } else if (!/^[+]?[\d\s-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Ingrese un número de teléfono válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      setErrors({ ...errors, image: "Solo se permiten archivos de imagen" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, image: "La imagen no puede superar los 5MB" });
      return;
    }

    setImageFile(file);
    setErrors({ ...errors, image: "" });

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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      let profileImageUrl = formData.profileImage;

      // Upload new image if selected
      if (imageFile) {
        const uploadResponse = await uploadsAPI.uploadImage(imageFile);
        if (uploadResponse.success && uploadResponse.data?.url) {
          profileImageUrl = uploadResponse.data.url;
        } else {
          throw new Error(
            uploadResponse.error || "Error al subir la imagen de perfil",
          );
        }
      }

      // Update user profile
      const response = await userAPI.update(user.id, {
        profileInfo: {
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          address: formData.address?.trim() || "",
          identificationNumber: formData.identificationNumber?.trim() || "",
          profileImage: profileImageUrl,
          verificationLevel: user.profileInfo?.verificationLevel || "none",
        },
      });

      if (response.success && response.data) {
        onUpdate(response.data);
      } else {
        throw new Error(response.error || "Error al actualizar el perfil");
      }
    } catch (error: any) {
      console.error("Profile update failed:", error);
      setErrors({
        general:
          error.message || "Error al actualizar el perfil. Intenta de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const getFieldLabel = (field: string): string => {
    if (field === "fullName") {
      if (user.role === "venue" || user.role === "gallera") {
        return "Nombre del representante";
      }
      return "Nombre completo";
    }
    return field;
  };

  return (
    <div className="space-y-6">
      {errors.general && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen de Perfil
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {imagePreview || formData.profileImage ? (
                <img
                  src={imagePreview || formData.profileImage}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user.username?.charAt(0).toUpperCase()}
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
                id="profile-image-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Cambiar imagen
              </button>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG o WebP. Máximo 5MB.
              </p>
              {errors.image && (
                <p className="text-red-500 text-xs mt-1">{errors.image}</p>
              )}
            </div>
          </div>
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email (no editable)
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            El email no puede ser modificado
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {getFieldLabel("fullName")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.fullName ? "border-red-500" : "border-gray-300"
            }`}
            required
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.phoneNumber ? "border-red-500" : "border-gray-300"
            }`}
            required
          />
          {errors.phoneNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
          )}
        </div>

        {/* Identification Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Identificación (Cédula/Pasaporte)
          </label>
          <input
            type="text"
            name="identificationNumber"
            value={formData.identificationNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfileForm;

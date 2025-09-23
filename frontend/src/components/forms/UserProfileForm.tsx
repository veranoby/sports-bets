// frontend/src/components/forms/UserProfileForm.tsx
// Formulario para editar información de usuario, extendido para roles venue/gallera con validación.

import React, { useState, useEffect } from "react";
import { usersAPI } from "../../config/api";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import { User as UserIcon, Mail, Building, Briefcase } from "lucide-react";
import type { User } from "../../types";

interface ExtendedProfileInfo extends NonNullable<User["profileInfo"]> {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  taxId?: string;
  licenseNumber?: string;
  registrationDetails?: string;
}

interface UserProfileFormData {
  username: string;
  email: string;
  role: User["role"];
  isActive: boolean;
  profileInfo: ExtendedProfileInfo;
}

type FormErrors = {
  [key in keyof ExtendedProfileInfo]?: string;
} & { email?: string; general?: string };

interface UserProfileFormProps {
  user: User;
  onSave: (userData: Partial<User>) => void;
  onCancel: () => void;
  showRoleChange?: boolean;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({
  user,
  onSave,
  onCancel,
  showRoleChange = false,
}) => {
  const [formData, setFormData] = useState<UserProfileFormData>({
    username: user?.username || "",
    email: user?.email || "",
    role: user?.role || "user",
    isActive: user?.isActive !== false,
    profileInfo: {
      fullName: user?.profileInfo?.fullName || "",
      phoneNumber: user?.profileInfo?.phoneNumber || "",
      address: user?.profileInfo?.address || "",
      identificationNumber: user?.profileInfo?.identificationNumber || "",
      verificationLevel: user?.profileInfo?.verificationLevel || "none",
      businessName: user?.profileInfo?.businessName || "",
      businessAddress: user?.profileInfo?.businessAddress || "",
      businessPhone: user?.profileInfo?.businessPhone || "",
      taxId: user?.profileInfo?.taxId || "",
      licenseNumber: user?.profileInfo?.licenseNumber || "",
      registrationDetails: user?.profileInfo?.registrationDetails || "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setFormData({
      username: user?.username || "",
      email: user?.email || "",
      role: user?.role || "user",
      isActive: user?.isActive !== false,
      profileInfo: {
        fullName: user?.profileInfo?.fullName || "",
        phoneNumber: user?.profileInfo?.phoneNumber || "",
        address: user?.profileInfo?.address || "",
        identificationNumber: user?.profileInfo?.identificationNumber || "",
        verificationLevel: user?.profileInfo?.verificationLevel || "none",
        businessName: user?.profileInfo?.businessName || "",
        businessAddress: user?.profileInfo?.businessAddress || "",
        businessPhone: user?.profileInfo?.businessPhone || "",
        taxId: user?.profileInfo?.taxId || "",
        licenseNumber: user?.profileInfo?.licenseNumber || "",
        registrationDetails: user?.profileInfo?.registrationDetails || "",
      },
    });
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, type } = e.target;
    const value =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    const fieldName = name.startsWith("profileInfo.")
      ? name.split(".")[1]
      : name;

    if (errors[fieldName as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }

    if (name.startsWith("profileInfo.")) {
      setFormData((prev) => ({
        ...prev,
        profileInfo: { ...prev.profileInfo, [fieldName]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!formData.email.includes("@")) {
      newErrors.email = "Email inválido.";
    }
    if (formData.role === "venue") {
      if (!formData.profileInfo.businessName)
        newErrors.businessName = "Nombre del negocio es requerido.";
      if (!formData.profileInfo.businessAddress)
        newErrors.businessAddress = "Dirección del negocio es requerida.";
      if (!formData.profileInfo.taxId)
        newErrors.taxId = "ID Fiscal es requerido.";
    }
    if (formData.role === "gallera") {
      if (!formData.profileInfo.identificationNumber)
        newErrors.identificationNumber =
          "Número de identificación es requerido.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      await usersAPI.updateProfile({
        profileInfo: formData.profileInfo,
      });

      if (showRoleChange) {
        if (formData.role !== user.role)
          await usersAPI.updateRole(user.id, formData.role);
        if (formData.isActive !== user.isActive)
          await usersAPI.updateStatus(user.id, formData.isActive);
      }

      onSave({ ...user, ...formData });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al actualizar el perfil.";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (
    name: keyof ExtendedProfileInfo,
    label: string,
    type: string = "text",
    required: boolean = false,
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={`profileInfo.${name}`}
        value={formData.profileInfo[name] || ""}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded-lg ${errors[name] ? "border-red-500" : "border-gray-300"}`}
        required={required}
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
      )}
    </div>
  );

  const renderVenueFields = () => (
    <>
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Información del Local (Venue)
          </h3>
        </div>
      </div>
      {renderField("businessName", "Nombre del Negocio", "text", true)}
      {renderField("businessAddress", "Dirección del Negocio", "text", true)}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField("businessPhone", "Teléfono del Negocio", "tel")}
        {renderField("taxId", "ID Fiscal (TAX ID)", "text", true)}
      </div>
      {renderField("licenseNumber", "Número de Licencia")}
    </>
  );

  const renderGalleraFields = () => (
    <>
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Información de la Gallera
          </h3>
        </div>
      </div>
      {renderField(
        "identificationNumber",
        "Número de Identificación",
        "text",
        true,
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Detalles de Registro
        </label>
        <textarea
          name="profileInfo.registrationDetails"
          value={formData.profileInfo.registrationDetails}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
    </>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <UserIcon className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Editar Perfil del Representante
        </h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Usuario
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
              required
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg ${errors.email ? "border-red-500" : "border-gray-300"}`}
              required
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
        </div>
        {renderField("fullName", "Nombre del Representante")}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField("phoneNumber", "Teléfono", "tel")}
          {renderField("identificationNumber", "Cédula/ID")}
        </div>
        {renderField("address", "Dirección")}

        {formData.role === "venue" && renderVenueFields()}
        {formData.role === "gallera" && renderGalleraFields()}

        {showRoleChange && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="user">Usuario</option>
                <option value="venue">Venue</option>
                <option value="gallera">Gallera</option>
                <option value="operator">Operador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Usuario Activo
              </label>
            </div>
          </div>
        )}

        {errors.general && <ErrorMessage error={errors.general} />}

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
              "Guardar Perfil"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfileForm;

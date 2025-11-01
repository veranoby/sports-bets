import React, { useState } from "react";
import { userAPI } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { Loader2, UserPlus } from "lucide-react";
import ErrorMessage from "../shared/ErrorMessage";
import ImageGalleryUpload from "../shared/ImageGalleryUpload";

type UserRole = "operator" | "venue" | "gallera" | "user";

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  profileInfo: {
    fullName: string;
    phoneNumber: string;
    images?: string[];
    // Venue fields
    venueName?: string;
    venueLocation?: string;
    venueDescription?: string;
    venueEmail?: string;
    venueWebsite?: string;
    // Gallera fields
    galleraName?: string;
    galleraLocation?: string;
    galleraDescription?: string;
    galleraEmail?: string;
    galleraWebsite?: string;
    galleraSpecialties?: string[];
    galleraActiveRoosters?: string[];
  };
}

interface CreateUserModalProps {
  role: UserRole;
  onClose: () => void;
  onUserCreated: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  role,
  onClose,
  onUserCreated,
}) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<CreateUserData>({
    username: "",
    email: "",
    password: "",
    role: role, // Usamos el rol pasado como prop
    profileInfo: {
      fullName: "",
      phoneNumber: "",
      images: [],
      // Venue fields
      venueName: "",
      venueLocation: "",
      venueDescription: "",
      venueEmail: "",
      venueWebsite: "",
      // Gallera fields
      galleraName: "",
      galleraLocation: "",
      galleraDescription: "",
      galleraEmail: "",
      galleraWebsite: "",
      galleraSpecialties: [],
      galleraActiveRoosters: [],
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener el título del modal según el rol
  const getModalTitle = () => {
    switch (role) {
      case "operator":
        return "Crear Nuevo Operador";
      case "venue":
        return "Crear Nueva Venue";
      case "gallera":
        return "Crear Nuevo Usuario Gallera";
      case "user":
        return "Crear Nuevo Usuario";
      default:
        return "Crear Usuario";
    }
  };

  // Función para obtener el mensaje de éxito según el rol
  const getSuccessMessage = (username: string) => {
    switch (role) {
      case "operator":
        return `El operador ${username} ha sido creado exitosamente.`;
      case "venue":
        return `La venue ${username} ha sido creada exitosamente.`;
      case "gallera":
        return `El usuario gallera ${username} ha sido creado exitosamente.`;
      case "user":
        return `El usuario ${username} ha sido creado exitosamente.`;
      default:
        return `El usuario ${username} ha sido creado exitosamente.`;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    // All profileInfo fields
    const profileFields = [
      "fullName",
      "phoneNumber",
      "venueName",
      "venueLocation",
      "venueDescription",
      "venueEmail",
      "venueWebsite",
      "galleraName",
      "galleraLocation",
      "galleraDescription",
      "galleraEmail",
      "galleraWebsite",
    ];

    if (profileFields.includes(name)) {
      setFormData((prev) => ({
        ...prev,
        profileInfo: {
          ...prev.profileInfo,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleArrayChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      profileInfo: {
        ...prev.profileInfo,
        [field]: value ? value.split(",").map((s) => s.trim()) : [],
      },
    }));
  };

  const handleImagesChange = (images: string[]) => {
    setFormData((prev) => ({
      ...prev,
      profileInfo: {
        ...prev.profileInfo,
        images: images,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await userAPI.create(formData);
      if (res.success) {
        addToast({
          type: "success",
          title: "Usuario Creado",
          message: getSuccessMessage(formData.username),
        });
        onUserCreated(); // Notify parent to refresh list
      } else {
        const errorMessage =
          res.error || "Ocurrió un error al crear el usuario.";
        setError(errorMessage);
        addToast({
          type: "error",
          title: "Error al Crear",
          message: errorMessage,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear el usuario.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Error al Crear",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle =
    "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{getModalTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorMessage error={error} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className={labelStyle}>
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className={labelStyle}>
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={inputStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelStyle}>
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className={inputStyle}
              />
            </div>

            <hr />

            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Información de Perfil (Opcional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className={labelStyle}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.profileInfo.fullName}
                  onChange={handleChange}
                  className={inputStyle}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className={labelStyle}>
                  Número de Teléfono
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.profileInfo.phoneNumber}
                  onChange={handleChange}
                  className={inputStyle}
                />
              </div>
            </div>

            {/* Venue-specific fields */}
            {role === "venue" && (
              <>
                <hr />
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Información del Local
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="venueName" className={labelStyle}>
                      Nombre del Local
                    </label>
                    <input
                      type="text"
                      id="venueName"
                      name="venueName"
                      value={formData.profileInfo.venueName || ""}
                      onChange={handleChange}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="venueLocation" className={labelStyle}>
                      Ubicación
                    </label>
                    <input
                      type="text"
                      id="venueLocation"
                      name="venueLocation"
                      value={formData.profileInfo.venueLocation || ""}
                      onChange={handleChange}
                      className={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="venueDescription" className={labelStyle}>
                    Descripción
                  </label>
                  <textarea
                    id="venueDescription"
                    name="venueDescription"
                    value={formData.profileInfo.venueDescription || ""}
                    onChange={handleChange}
                    rows={3}
                    className={inputStyle}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="venueEmail" className={labelStyle}>
                      Email del Local
                    </label>
                    <input
                      type="email"
                      id="venueEmail"
                      name="venueEmail"
                      value={formData.profileInfo.venueEmail || ""}
                      onChange={handleChange}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="venueWebsite" className={labelStyle}>
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      id="venueWebsite"
                      name="venueWebsite"
                      value={formData.profileInfo.venueWebsite || ""}
                      onChange={handleChange}
                      className={inputStyle}
                    />
                  </div>
                </div>

                {/* Venue Image Gallery */}
                <div>
                  <ImageGalleryUpload
                    images={formData.profileInfo.images || []}
                    onImagesChange={handleImagesChange}
                    maxImages={2}
                    label="Imágenes del Local"
                  />
                </div>
              </>
            )}

            {/* Gallera-specific fields */}
            {role === "gallera" && (
              <>
                <hr />
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Información de la Gallera
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="galleraName" className={labelStyle}>
                      Nombre de la Gallera
                    </label>
                    <input
                      type="text"
                      id="galleraName"
                      name="galleraName"
                      value={formData.profileInfo.galleraName || ""}
                      onChange={handleChange}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="galleraLocation" className={labelStyle}>
                      Ubicación
                    </label>
                    <input
                      type="text"
                      id="galleraLocation"
                      name="galleraLocation"
                      value={formData.profileInfo.galleraLocation || ""}
                      onChange={handleChange}
                      className={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="galleraDescription" className={labelStyle}>
                    Descripción
                  </label>
                  <textarea
                    id="galleraDescription"
                    name="galleraDescription"
                    value={formData.profileInfo.galleraDescription || ""}
                    onChange={handleChange}
                    rows={3}
                    className={inputStyle}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="galleraEmail" className={labelStyle}>
                      Email de la Gallera
                    </label>
                    <input
                      type="email"
                      id="galleraEmail"
                      name="galleraEmail"
                      value={formData.profileInfo.galleraEmail || ""}
                      onChange={handleChange}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="galleraWebsite" className={labelStyle}>
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      id="galleraWebsite"
                      name="galleraWebsite"
                      value={formData.profileInfo.galleraWebsite || ""}
                      onChange={handleChange}
                      className={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="galleraSpecialties" className={labelStyle}>
                    Especialidades (separadas por coma)
                  </label>
                  <textarea
                    id="galleraSpecialties"
                    value={(formData.profileInfo.galleraSpecialties || []).join(
                      ", ",
                    )}
                    onChange={(e) =>
                      handleArrayChange("galleraSpecialties", e.target.value)
                    }
                    rows={2}
                    placeholder="ej: Gallos de Pelea, Crianza, Entrenamiento"
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label htmlFor="galleraActiveRoosters" className={labelStyle}>
                    Roosters Activos (separados por coma)
                  </label>
                  <textarea
                    id="galleraActiveRoosters"
                    value={(
                      formData.profileInfo.galleraActiveRoosters || []
                    ).join(", ")}
                    onChange={(e) =>
                      handleArrayChange("galleraActiveRoosters", e.target.value)
                    }
                    rows={2}
                    placeholder="ej: Rojo, Negro, Pinto"
                    className={inputStyle}
                  />
                </div>

                {/* Gallera Image Gallery */}
                <div>
                  <ImageGalleryUpload
                    images={formData.profileInfo.images || []}
                    onImagesChange={handleImagesChange}
                    maxImages={3}
                    label="Imágenes de la Gallera"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end pt-4 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-400 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Crear{" "}
                    {role === "operator"
                      ? "Operador"
                      : role === "venue"
                        ? "Venue"
                        : role === "gallera"
                          ? "Gallera"
                          : "Usuario"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;

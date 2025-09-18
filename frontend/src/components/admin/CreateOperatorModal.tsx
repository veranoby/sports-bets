import React, { useState } from "react";
import { userAPI } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { Loader2, UserPlus } from "lucide-react";
import ErrorMessage from "../shared/ErrorMessage";

interface CreateOperatorData {
  username: string;
  email: string;
  password: string;
  role: "operator";
  profileInfo: {
    fullName: string;
    phoneNumber: string;
  };
}

interface CreateOperatorModalProps {
  onClose: () => void;
  onOperatorCreated: () => void;
}

const CreateOperatorModal: React.FC<CreateOperatorModalProps> = ({ onClose, onOperatorCreated }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<CreateOperatorData>({
    username: "",
    email: "",
    password: "",
    role: "operator", // Hardcoded to 'operator'
    profileInfo: {
      fullName: "",
      phoneNumber: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    if (name === "fullName" || name === "phoneNumber") {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await userAPI.create(formData);
      if (res.success) {
        addToast({
          type: "success",
          title: "Operador Creado",
          message: `Operador ${formData.username} creado exitosamente`,
        });
        onOperatorCreated(); // Notify parent to refresh list
      } else {
        setError(res.error || "Error al crear operador");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear operador");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Operador</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <ErrorMessage error={error} />
            )}

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
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                    Crear Operador
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

export default CreateOperatorModal;

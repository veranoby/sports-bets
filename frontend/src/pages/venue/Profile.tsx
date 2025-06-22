import React, { useState } from "react";
import {
  User,
  Edit3,
  Save,
  X,
  Mail,
  Shield,
  Calendar,
  Award,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Card from "../../components/shared/Card";

const VenueProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    venueName: user?.profileInfo?.venueName || "",
    address: user?.profileInfo?.address || "",
    phone: user?.profileInfo?.phone || "",
    description: user?.profileInfo?.description || "",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simular guardado en API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-theme-main text-theme-primary min-h-screen pb-24">
      <div className="p-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#2a325c] to-[#1a1f37] rounded-2xl p-6 mb-6 border border-[#596c95]/20">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#596c95] flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {formData.venueName || "Mi Local"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400">Propietario</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Información del Local</h3>
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm"
                >
                  {loading ? <LoadingSpinner size="sm" /> : <Save size={14} />}
                  Guardar
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded text-sm"
                >
                  <X size={14} />
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1 bg-[#596c95] text-white rounded text-sm"
              >
                <Edit3 size={14} />
                Editar
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Nombre del Local
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.venueName}
                  onChange={(e) =>
                    setFormData({ ...formData, venueName: e.target.value })
                  }
                  className="w-full bg-[#1a1f37] border border-[#596c95] text-white rounded px-3 py-2"
                />
              ) : (
                <div className="bg-[#1a1f37] rounded px-3 py-2">
                  {formData.venueName || "No especificado"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Dirección
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full bg-[#1a1f37] border border-[#596c95] text-white rounded px-3 py-2"
                />
              ) : (
                <div className="bg-[#1a1f37] rounded px-3 py-2">
                  {formData.address || "No especificado"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Teléfono
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full bg-[#1a1f37] border border-[#596c95] text-white rounded px-3 py-2"
                />
              ) : (
                <div className="bg-[#1a1f37] rounded px-3 py-2">
                  {formData.phone || "No especificado"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Descripción
              </label>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-[#1a1f37] border border-[#596c95] text-white rounded px-3 py-2 min-h-[100px]"
                />
              ) : (
                <div className="bg-[#1a1f37] rounded px-3 py-2 min-h-[100px]">
                  {formData.description || "No especificado"}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Account Settings */}
        <Card>
          <h3 className="text-lg font-bold mb-4">Configuración de Cuenta</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#1a1f37] rounded">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#596c95]" />
                <span>Correo electrónico</span>
              </div>
              <span className="text-gray-400">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#1a1f37] rounded">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#596c95]" />
                <span>Seguridad</span>
              </div>
              <button className="text-[#596c95] hover:text-[#4a5b80] text-sm">
                Cambiar contraseña
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VenueProfile;

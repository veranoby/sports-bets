// frontend/src/components/forms/UserProfileForm.tsx
// Formulario para editar información básica del usuario

import React, { useState } from 'react';
import { usersAPI } from '../../config/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import { User, Phone, MapPin, CreditCard, Mail } from 'lucide-react';

interface UserProfileFormProps {
  user: any;
  onSave: (userData: any) => void;
  onCancel: () => void;
  showRoleChange?: boolean;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ user, onSave, onCancel, showRoleChange = false }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'user',
    is_active: user?.is_active !== false,
    profileInfo: {
      fullName: user?.profile_info?.fullName || '',
      phoneNumber: user?.profile_info?.phoneNumber || '',
      address: user?.profile_info?.address || '',
      identificationNumber: user?.profile_info?.identificationNumber || ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, checked, value } = e.target as HTMLInputElement;
    
    if (name.startsWith('profileInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        profileInfo: {
          ...prev.profileInfo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      
      // Update profile info
      result = await usersAPI.updateProfile({
        profileInfo: formData.profileInfo
      });
      
      // Update role if needed (admin only)
      if (showRoleChange && formData.role !== user.role) {
        await usersAPI.updateRole(user.id, formData.role);
      }
      
      // Update status if needed (admin only)
      if (formData.is_active !== user.is_active) {
        await usersAPI.updateStatus(user.id, formData.is_active);
      }
      
      onSave({
        ...user,
        ...formData,
        profile_info: formData.profileInfo
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil del usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-blue-600" />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled // Username typically shouldn't be changed
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Representante
          </label>
          <input
            type="text"
            name="profileInfo.fullName"
            value={formData.profileInfo.fullName}
            onChange={handleChange}
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
              name="profileInfo.phoneNumber"
              value={formData.profileInfo.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CreditCard className="w-4 h-4 inline mr-1" />
              Cédula/ID
            </label>
            <input
              type="text"
              name="profileInfo.identificationNumber"
              value={formData.profileInfo.identificationNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            Dirección
          </label>
          <input
            type="text"
            name="profileInfo.address"
            value={formData.profileInfo.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Usuario Activo
              </label>
            </div>
          </div>
        )}

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
              'Guardar Perfil'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfileForm;
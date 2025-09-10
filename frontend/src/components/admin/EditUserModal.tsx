// frontend/src/components/admin/EditUserModal.tsx
// Modal completo para editar usuarios incluyendo gestión de suscripciones

import React, { useState, useEffect } from 'react';
import { usersAPI, subscriptionAPI } from '../../config/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import StatusChip from '../shared/StatusChip';
import { User, Crown, Calendar, CreditCard, X } from 'lucide-react';
import type { User as UserType } from '../../types';

interface EditUserModalProps {
  user: UserType;
  onClose: () => void;
  onUserUpdated: (updatedUser: UserType) => void;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'daily' | 'monthly';
  price: number;
  description: string;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onUserUpdated }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription'>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    username: user.username,
    email: user.email,
    isActive: user.isActive,
    role: user.role,
    profileInfo: {
      fullName: user.profileInfo?.fullName || '',
      phoneNumber: user.profileInfo?.phoneNumber || '',
      address: user.profileInfo?.address || '',
      identificationNumber: user.profileInfo?.identificationNumber || '',
      verificationLevel: user.profileInfo?.verificationLevel || 'none'
    }
  });

  // Subscription form data
  const [subscriptionData, setSubscriptionData] = useState({
    planType: user.subscription?.planType || 'daily',
    status: user.subscription?.status || 'inactive',
    action: 'none' as 'none' | 'create' | 'cancel' | 'renew'
  });

  useEffect(() => {
    loadAvailablePlans();
  }, []);

  const loadAvailablePlans = async () => {
    try {
      const response = await subscriptionAPI.getPlans();
      setAvailablePlans(response.data || []);
    } catch (err) {
      console.error('Error loading plans:', err);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, checked, value } = e.target as HTMLInputElement;
    
    if (name.startsWith('profileInfo.')) {
      const field = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        profileInfo: {
          ...prev.profileInfo,
          [field]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubscriptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSubscriptionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update user profile
      await usersAPI.updateProfile({
        profileInfo: profileData.profileInfo
      });

      // Update user role if changed (admin only)
      if (profileData.role !== user.role) {
        await usersAPI.updateRole(user.id, profileData.role);
      }

      // Update user status if changed
      if (profileData.isActive !== user.isActive) {
        await usersAPI.updateStatus(user.id, profileData.isActive);
      }

      // Handle subscription changes
      if (subscriptionData.action !== 'none') {
        await handleSubscriptionAction();
      }

      // Update parent component
      onUserUpdated({
        ...user,
        ...profileData,
        subscription: subscriptionData.action === 'cancel' 
          ? undefined 
          : user.subscription
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionAction = async () => {
    switch (subscriptionData.action) {
      case 'create':
        // This would typically involve payment processing
        // For admin, we might create a subscription directly
        console.log('Creating subscription for user:', user.id);
        break;
      case 'cancel':
        if (user.subscription) {
          await subscriptionAPI.cancelSubscription();
        }
        break;
      case 'renew':
        // Handle renewal logic
        console.log('Renewing subscription for user:', user.id);
        break;
    }
  };

  const getSubscriptionStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Editar Usuario: {user.username}
              </h2>
              <p className="text-sm text-gray-500">
                Gestionar perfil y suscripción
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              👤 Perfil
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subscription'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              💳 Suscripción
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="profileInfo.fullName"
                  value={profileData.profileInfo.fullName}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="profileInfo.phoneNumber"
                    value={profileData.profileInfo.phoneNumber}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula/ID
                  </label>
                  <input
                    type="text"
                    name="profileInfo.identificationNumber"
                    value={profileData.profileInfo.identificationNumber}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="profileInfo.address"
                  value={profileData.profileInfo.address}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    name="role"
                    value={profileData.role}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="user">Usuario</option>
                    <option value="venue">Venue</option>
                    <option value="gallera">Gallera</option>
                    <option value="operator">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={profileData.isActive}
                    onChange={handleProfileChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Usuario Activo
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {/* Current Subscription */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Suscripción Actual
                </h3>
                
                {user.subscription ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Plan:</span>
                      <span className="font-medium">
                        {user.subscription.planType === 'daily' ? '📅 Diario' : '📆 Mensual'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Estado:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubscriptionStatusColor(user.subscription.status)}`}>
                        {user.subscription.status}
                      </span>
                    </div>
                    {user.subscription.expiresAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Expira:</span>
                        <span className="text-sm font-medium">
                          {new Date(user.subscription.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">El usuario no tiene suscripción activa</p>
                )}
              </div>

              {/* Subscription Actions */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Gestionar Suscripción</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Acción
                    </label>
                    <select
                      name="action"
                      value={subscriptionData.action}
                      onChange={handleSubscriptionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="none">Sin cambios</option>
                      {!user.subscription && <option value="create">Crear suscripción</option>}
                      {user.subscription && (
                        <>
                          <option value="renew">Renovar suscripción</option>
                          <option value="cancel">Cancelar suscripción</option>
                        </>
                      )}
                    </select>
                  </div>

                  {(subscriptionData.action === 'create' || subscriptionData.action === 'renew') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Plan
                      </label>
                      <select
                        name="planType"
                        value={subscriptionData.planType}
                        onChange={handleSubscriptionChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="daily">📅 Plan Diario</option>
                        <option value="monthly">📆 Plan Mensual</option>
                      </select>
                    </div>
                  )}

                  {subscriptionData.action === 'cancel' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">
                        ⚠️ Esta acción cancelará la suscripción del usuario inmediatamente.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Plans Info */}
              {availablePlans.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Planes Disponibles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availablePlans.map((plan) => (
                      <div key={plan.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{plan.name}</span>
                          <span className="text-sm font-bold text-green-600">
                            ${plan.price}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{plan.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>

        {error && (
          <div className="px-6 py-2">
            <ErrorMessage error={error} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditUserModal;
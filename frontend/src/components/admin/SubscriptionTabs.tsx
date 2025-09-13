// frontend/src/components/admin/SubscriptionTabs.tsx
// Componente para gestionar suscripciones con radio buttons

import React, { useState } from 'react';
import { subscriptionAPI } from '../../config/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import { CreditCard, Crown, RotateCcw, XCircle } from 'lucide-react';

interface SubscriptionTabsProps {
  userId: string;
  subscription?: any;
  onSave: (subscriptionData: any) => void;
  onCancel: () => void;
}

const SubscriptionTabs: React.FC<SubscriptionTabsProps> = ({ userId, subscription, onSave, onCancel }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(
    subscription?.planType || 'free'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Determinar si la suscripción está activa
  const isSubscriptionActive = subscription?.status === 'active' && 
    subscription?.expiresAt && 
    new Date(subscription.expiresAt) > new Date();

  // Fecha de activación
  const activationDate = subscription?.createdAt 
    ? new Date(subscription.createdAt) 
    : null;

  // Fecha de expiración
  const expirationDate = subscription?.expiresAt 
    ? new Date(subscription.expiresAt) 
    : null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      
      
      // Si se selecciona "gratis", cancelar suscripción existente
      if (selectedPlan === 'free' && subscription) {
        await subscriptionAPI.cancelSubscription();
      } 
      // Si se selecciona un plan de pago, crear/renovar suscripción
      else if (selectedPlan !== 'free') {
        // En un entorno real, esto involucraría procesamiento de pago
        // Por ahora, simulamos la creación/renovación
        console.log(`Crear/renovar suscripción ${selectedPlan} para usuario:`, userId);
        // Aquí iría la lógica real de creación/renovación
      }
      
      const expirationDate = selectedPlan === 'daily' 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : selectedPlan === 'monthly' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;
      
      onSave({
        ...subscription,
        planType: selectedPlan === 'free' ? null : selectedPlan,
        status: selectedPlan === 'free' ? 'cancelled' : 'active',
        // En una implementación real, estos valores vendrían del backend
        createdAt: new Date().toISOString(),
        expiresAt: expirationDate ? expirationDate.toISOString() : null
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la suscripción');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta suscripción?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Cancelar suscripción
      await subscriptionAPI.cancelSubscription();
      
      onSave({
        ...subscription,
        planType: null,
        status: 'cancelled',
        expiresAt: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar la suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!window.confirm('¿Estás seguro de que quieres reactivar esta suscripción?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Reactivar suscripción con el plan seleccionado
      console.log(`Reactivar suscripción ${selectedPlan} para usuario:`, userId);
      
      const expirationDate = selectedPlan === 'daily' 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      onSave({
        ...subscription,
        planType: selectedPlan,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: expirationDate.toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reactivar la suscripción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Plan de Suscripción
        </h3>
      </div>

      <div className="space-y-6">
        {/* Información de suscripción actual */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-500" />
            Suscripción Actual
          </h4>
          
          {subscription ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Plan:</span>
                <span className="font-medium">
                  {subscription.planType === 'daily' 
                    ? '📅 Acceso Diario' 
                    : subscription.planType === 'monthly' 
                    ? '📆 Acceso Mensual' 
                    : '🆓 Gratuito'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isSubscriptionActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isSubscriptionActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              {activationDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Última activación:</span>
                  <span className="text-sm font-medium">
                    {activationDate.toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
              {expirationDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expira:</span>
                  <span className="text-sm font-medium">
                    {expirationDate.toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
              {isSubscriptionActive && expirationDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Días restantes:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">El usuario no tiene suscripción activa</p>
          )}
        </div>

        {/* Opciones de suscripción */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Seleccionar Plan</h4>
          
          <div className="space-y-3">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="subscriptionPlan"
                value="free"
                checked={selectedPlan === 'free'}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="flex items-center">
                  <span className="font-medium">Gratis</span>
                  <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                    Limitado
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Acceso básico con funcionalidades limitadas
                </p>
              </div>
            </label>

            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="subscriptionPlan"
                value="daily"
                checked={selectedPlan === 'daily'}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="flex items-center">
                  <span className="font-medium">Acceso Diario</span>
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    $2.50/día
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Acceso completo por 24 horas
                </p>
              </div>
            </label>

            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="subscriptionPlan"
                value="monthly"
                checked={selectedPlan === 'monthly'}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="flex items-center">
                  <span className="font-medium">Acceso Mensual</span>
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    $10.00/mes
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Acceso completo por 30 días
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-3 pt-4">
          {subscription && subscription.planType && subscription.planType !== 'free' && (
            <button
              type="button"
              onClick={handleCancelSubscription}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Cancelar
                </>
              )}
            </button>
          )}
          
          {subscription && subscription.planType && subscription.planType !== 'free' && (
            <button
              type="button"
              onClick={handleReactivateSubscription}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Reativar
                </>
              )}
            </button>
          )}
          
          <div className="flex-1"></div>
          
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>

        {error && <ErrorMessage error={error} />}
      </div>
    </div>
  );
};

export default SubscriptionTabs;
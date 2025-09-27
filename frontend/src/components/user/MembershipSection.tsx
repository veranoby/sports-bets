
import React from 'react';
import { ShieldCheck, XCircle, Clock } from 'lucide-react';

interface Subscription {
  manual_expires_at?: string | null;
  membership_type?: string | null;
  status?: 'active' | 'expired' | 'pending' | null;
}

interface MembershipSectionProps {
  subscription: Subscription | null | undefined;
}

const statusConfig = {
  active: {
    icon: <ShieldCheck className="w-5 h-5 text-green-500" />,
    label: 'Activa',
    textColor: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  expired: {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    label: 'Expirada',
    textColor: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  pending: {
    icon: <Clock className="w-5 h-5 text-yellow-500" />,
    label: 'Pendiente',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
};

const MembershipSection: React.FC<MembershipSectionProps> = ({ subscription }) => {
  const currentStatus = subscription?.status || 'expired';
  const config = statusConfig[currentStatus];

  const expirationDate = subscription?.manual_expires_at
    ? new Date(subscription.manual_expires_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Gestión de Membresía
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Plan Actual
          </label>
          <p className="text-lg font-semibold text-gray-800">
            {subscription?.membership_type || 'Ninguno'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Estado
          </label>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
            {config.icon}
            {config.label}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Fecha de Expiración
          </label>
          <p className="text-lg font-semibold text-gray-800">{expirationDate}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          onClick={() => {
            /* Logica para abrir modal o contactar a soporte */
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          Solicitar Cambio de Membresía
        </button>
        <p className="text-sm text-gray-500">
          Nota: Todos los cambios de membresía requieren aprobación de un administrador.
        </p>
      </div>
    </div>
  );
};

export default MembershipSection;

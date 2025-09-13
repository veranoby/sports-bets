import React from 'react';
import useSSE from '../../hooks/useSSE';

interface BettingNotificationData {
  type: string;
  data?: {
    amount: number;
    fighter: string;
  };
}

interface BettingNotificationsResponse {
  data: BettingNotificationData;
}

const BettingNotifications: React.FC = () => {
  // Usar SSE para obtener notificaciones de apuestas
  // Esta funcionalidad está deshabilitada por la feature flag
  const bettingNotifications = process.env.REACT_APP_FEATURES_BETTING === 'true' 
    ? useSSE<BettingNotificationsResponse>('/api/sse/users/me/betting') 
    : null;

  // No renderizar nada si las notificaciones están deshabilitadas
  if (process.env.REACT_APP_FEATURES_BETTING !== 'true' || !bettingNotifications) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Aquí se mostrarían las notificaciones de apuestas */}
      {bettingNotifications?.data && (
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg">
          <h4 className="font-semibold">Notificación de Apuesta</h4>
          <p>Tipo: {bettingNotifications.data.type}</p>
          {bettingNotifications.data.data && (
            <div>
              <p>Monto: ${bettingNotifications.data.data.amount}</p>
              <p>Peleador: {bettingNotifications.data.data.fighter}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BettingNotifications;
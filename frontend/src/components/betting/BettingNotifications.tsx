import React from 'react';
import useSSE from '../../hooks/useSSE';
import { type BettingNotificationData, type BettingNotificationsResponse } from '../../types';

const BettingNotifications: React.FC = () => {
  // Siempre llamar useSSE para respetar las reglas de React Hooks
  // Pero solo usar los datos si la feature está habilitada
  const bettingNotifications = useSSE<BettingNotificationsResponse>('/api/sse/users/me/betting');
  
  const isBettingEnabled = process.env.REACT_APP_FEATURES_BETTING === 'true';

  // No renderizar nada si las notificaciones están deshabilitadas o no hay datos
  if (!isBettingEnabled || !bettingNotifications) {
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
              <p>Monto: ${bettingNotifications.data.amount}</p>
              <p>Peleador: {bettingNotifications.data.fighter}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BettingNotifications;
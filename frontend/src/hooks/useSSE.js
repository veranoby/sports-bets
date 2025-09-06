import { useState, useEffect } from 'react';

/**
 * Hook personalizado para Server-Sent Events (SSE)
 * @param {string} endpoint - Endpoint SSE al que conectarse
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Objeto con datos, error y estado de conexión
 */
const useSSE = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  
  const {
    dependencies = [],
    reconnectInterval = 5000,
    withCredentials = false
  } = options;

  useEffect(() => {
    let eventSource = null;
    let reconnectTimeout = null;

    const connect = () => {
      try {
        // Crear nueva conexión SSE
        eventSource = new EventSource(endpoint, { withCredentials });
        
        // Manejar conexión abierta
        eventSource.onopen = () => {
          setConnected(true);
          setError(null);
        };
        
        // Manejar mensajes recibidos
        eventSource.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data);
            setData(parsedData);
          } catch (parseError) {
            console.warn('Error parsing SSE message:', parseError);
          }
        };
        
        // Manejar eventos personalizados
        eventSource.addEventListener('event_activated', (event) => {
          try {
            const parsedData = JSON.parse(event.data);
            setData(prevData => ({
              ...prevData,
              ...parsedData,
              eventType: 'event_activated'
            }));
          } catch (parseError) {
            console.warn('Error parsing event_activated message:', parseError);
          }
        });
        
        // Manejar errores
        eventSource.onerror = (err) => {
          setConnected(false);
          setError(err);
          
          // Intentar reconectar
          if (reconnectInterval > 0) {
            reconnectTimeout = setTimeout(() => {
              eventSource.close();
              connect();
            }, reconnectInterval);
          }
        };
      } catch (err) {
        setError(err);
        setConnected(false);
      }
    };

    // Iniciar conexión
    connect();
    
    // Limpiar conexión al desmontar o cambiar dependencias
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [endpoint, ...dependencies, reconnectInterval, withCredentials]);

  return { data, error, connected };
};

export default useSSE;
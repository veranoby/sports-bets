import { useState, useEffect } from 'react';

/**
 * Hook personalizado para manejar conexiones SSE (Server-Sent Events)
 * @param {string} endpoint - La URL del endpoint SSE
 * @param {Array} dependencies - Array de dependencias para reconectar cuando cambian
 * @returns {object} - Objeto con los datos recibidos y el estado de conexión
 */
const useSSE = (endpoint, dependencies = []) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let eventSource = null;
    let reconnectTimeout = null;
    
    // Función para conectar al servidor SSE
    const connect = () => {
      try {
        // Crear nueva conexión EventSource
        eventSource = new EventSource(`${process.env.REACT_APP_API_BASE_URL || ''}${endpoint}`);
        
        // Manejar mensajes generales
        eventSource.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data);
            setData(parsedData);
            setIsLoading(false);
          } catch (err) {
            console.error('Error parsing SSE data:', err);
            setError('Error parsing data');
          }
        };
        
        // Manejar eventos específicos
        eventSource.addEventListener('stream_status', (event) => {
          try {
            const parsedData = JSON.parse(event.data);
            setData(prevData => ({
              ...prevData,
              streamStatus: parsedData
            }));
            setIsLoading(false);
          } catch (err) {
            console.error('Error parsing stream_status event:', err);
            setError('Error parsing stream_status event');
          }
        });
        
        // Manejar errores de conexión
        eventSource.onerror = (err) => {
          console.error('SSE connection error:', err);
          setError('Connection error');
          setIsLoading(false);
          
          // Intentar reconectar después de 5 segundos
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              if (eventSource) {
                eventSource.close();
              }
              connect();
            }, 5000);
          }
        };
        
        // Limpiar errores al conectarse
        eventSource.onopen = () => {
          setError(null);
          setIsLoading(false);
        };
        
      } catch (err) {
        console.error('Error creating EventSource:', err);
        setError('Failed to create connection');
        setIsLoading(false);
      }
    };
    
    // Iniciar conexión
    connect();
    
    // Función de limpieza
    return () => {
      // Limpiar timeout de reconexión si existe
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      
      // Cerrar conexión SSE si existe
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [endpoint, ...dependencies]); // Reconectar cuando cambian el endpoint o las dependencias
  
  return { data, error, isLoading };
};

export default useSSE;
class SSEService {
  constructor() {
    // Map para almacenar las conexiones SSE
    // La clave será un identificador único (por ejemplo, eventId para transmisiones)
    // El valor será un array de objetos Response (conexiones SSE)
    this.connections = new Map();
  }

  /**
   * Agrega una nueva conexión SSE
   * @param {string} key - Identificador único (por ejemplo, eventId)
   * @param {Response} response - Objeto de respuesta HTTP
   */
  addConnection(key, response) {
    if (!this.connections.has(key)) {
      this.connections.set(key, []);
    }
    
    this.connections.get(key).push(response);
    
    // Note: Headers should be set by the route middleware, not here
    // to avoid duplicate header issues
  }

  /**
   * Remueve una conexión SSE
   * @param {string} key - Identificador único
   * @param {Response} response - Objeto de respuesta HTTP a remover
   */
  removeConnection(key, response) {
    if (this.connections.has(key)) {
      const connections = this.connections.get(key);
      const index = connections.indexOf(response);
      
      if (index !== -1) {
        connections.splice(index, 1);
      }
      
      // Si no quedan conexiones para esta clave, eliminar la entrada
      if (connections.length === 0) {
        this.connections.delete(key);
      }
    }
  }

  /**
   * Envía datos a todas las conexiones
   * @param {string} event - Nombre del evento
   * @param {any} data - Datos a enviar
   */
  broadcast(event, data) {
    // Iterar sobre todas las conexiones
    for (const [key, connections] of this.connections.entries()) {
      this.broadcastToEvent(key, event, data);
    }
  }

  /**
   * Envía datos a todas las conexiones de un evento específico
   * @param {string} eventKey - Identificador del evento
   * @param {string} event - Nombre del evento
   * @param {any} data - Datos a enviar
   */
  broadcastToEvent(eventKey, event, data) {
    if (this.connections.has(eventKey)) {
      const connections = this.connections.get(eventKey);
      
      // Convertir datos a formato JSON si no lo están
      const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Enviar datos a todas las conexiones del evento
      connections.forEach((response) => {
        try {
          // Escribir el evento y los datos
          response.write(`event: ${event}\n`);
          response.write(`data: ${jsonData}\n\n`);
        } catch (error) {
          // Si hay un error al escribir, remover la conexión
          this.removeConnection(eventKey, response);
        }
      });
    }
  }
}

// Exportar una instancia singleton del servicio
module.exports = new SSEService();
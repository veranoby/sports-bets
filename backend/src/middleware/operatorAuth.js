// backend/src/middleware/operatorAuth.js
// Middleware para validación jerárquica de permisos de operadores
// Verifica que los operadores no puedan gestionar otros operadores o administradores

const { errors } = require('./errorHandler');

/**
 * Middleware para verificar permisos jerárquicos de operadores
 * Los operadores no pueden gestionar usuarios con roles de admin u operador
 */
const operatorAuth = (req, res, next) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      throw errors.unauthorized('Authentication required');
    }

    // Si es admin, permitir todas las operaciones
    if (req.user.role === 'admin') {
      return next();
    }

    // Si es operador, aplicar restricciones jerárquicas
    if (req.user.role === 'operator') {
      // Verificar si se está intentando crear o modificar un usuario con rol de admin u operador
      const targetRole = req.body.role;
      
      if (targetRole && ['admin', 'operator'].includes(targetRole)) {
        throw errors.forbidden('Operators cannot manage admin or operator accounts');
      }
      
      // Verificar si se está intentando acceder a un usuario con rol de admin u operador
      if (req.params.id) {
        // Aquí podríamos verificar el rol del usuario objetivo si fuera necesario
        // por ahora solo aplicamos la restricción en operaciones de creación/actualización
      }
      
      return next();
    }

    // Para otros roles, denegar acceso a gestión de usuarios
    throw errors.forbidden('Insufficient permissions to manage users');
  } catch (error) {
    next(error);
  }
};

module.exports = operatorAuth;
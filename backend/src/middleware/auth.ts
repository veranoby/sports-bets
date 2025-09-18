import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { errors } from './errorHandler';

// Extender Request interface para incluir user y queryFilter
declare global {
  namespace Express {
    interface Request {
      user?: User;
      queryFilter?: any;
    }
  }
}

// Middleware de autenticación
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw errors.unauthorized('No token provided');
    }

    console.log('Token received:', token);
    console.log('JWT Secret:', process.env.JWT_SECRET);

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('Decoded token:', decoded);
    
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      throw errors.unauthorized('Invalid token or user inactive');
    }

    // lastLogin is only updated during actual login in auth.ts
    // Removed excessive database updates per request

    req.user = user;
    next();
  } catch (error: any) {
    console.log('Authentication error:', error.name, error.message);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(errors.unauthorized('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

// Middleware de autorización por rol
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(errors.unauthorized('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(errors.forbidden('Insufficient permissions'));
    }

    next();
  };
};

// Función para extraer token del header
const extractToken = (req: Request): string | null => {
  // Check for authorization header in multiple possible formats
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // También buscar en cookies si es necesario
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

// Middleware para rutas opcionales de autenticación
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // En autenticación opcional, continuamos sin usuario si hay error
    next();
  }
};

// Middleware para filtrar datos para operadores
export const filterByOperatorAssignment = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Si el usuario es un operador, añadimos un filtro para sus consultas.
  // Este filtro será usado en los controladores para limitar los resultados
  // a los eventos/datos que le han sido asignados.
  if (req.user?.role === 'operator') {
    // Se adjunta el filtro al objeto de la petición.
    // Los controladores deben estar preparados para usar este filtro.
    req.queryFilter = { operatorId: req.user.id };
  }

  // Si el rol es 'admin' o cualquier otro, no se aplica ningún filtro,
  // permitiendo acceso completo (según lo definido en 'authorize').
  next();
};

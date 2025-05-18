import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { errors } from './errorHandler';

// Extender Request interface para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: User;
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      throw errors.unauthorized('Invalid token or user inactive');
    }

    // Actualizar último acceso
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error: any) {
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
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
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
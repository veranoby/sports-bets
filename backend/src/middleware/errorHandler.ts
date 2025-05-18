import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Interfaz para errores personalizados
export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

// Middleware de manejo de errores
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Log del error
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error(error.stack);

  // Errores específicos de Sequelize
  if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation error';
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Resource already exists';
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Invalid reference';
  }

  // Errores de JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Error de validación de Joi
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  }

  // Respuesta del error
  const response: any = {
    error: true,
    message,
    statusCode
  };

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Middleware para capturar errores async
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Función para crear errores personalizados
export const createError = (message: string, statusCode: number): CustomError => {
  const error: CustomError = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Errores comunes predefinidos
export const errors = {
  badRequest: (message: string = 'Bad Request') => createError(message, 400),
  unauthorized: (message: string = 'Unauthorized') => createError(message, 401),
  forbidden: (message: string = 'Forbidden') => createError(message, 403),
  notFound: (message: string = 'Not Found') => createError(message, 404),
  conflict: (message: string = 'Conflict') => createError(message, 409),
  internal: (message: string = 'Internal Server Error') => createError(message, 500)
};
import { NotFoundError } from '../utils/errors/index.js';
import { ERROR_MESSAGES } from '../utils/errors/errorMessages.js';

// Middleware para rutas no encontradas (404)
export const notFound = (req, res, next) => {
  next(new NotFoundError(`${ERROR_MESSAGES.COMMON.ROUTE_NOT_FOUND} - ${req.originalUrl}`));
};

// Centralizado de gestión de errores
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || ERROR_MESSAGES.COMMON.INTERNAL_SERVER_ERROR;

  // CastError de Mongoose (formato de ObjectId incorrecto)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = ERROR_MESSAGES.COMMON.INVALID_ID;
  }

  // Error de validación de esquemas Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Clave duplicada en MongoDB (índices únicos como email)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'campo';
    message = `🚫 El valor del campo '${field}' ya está registrado`;
  }

  res.status(statusCode).json({
    status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
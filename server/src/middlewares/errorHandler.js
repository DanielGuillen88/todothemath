// Middleware para rutas no encontradas (404)
export const notFound = (req, res, next) => {
  const error = new Error(`⛔️ Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware centralizado de errores
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Error de Cast de Mongoose (ID inválido)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = '❌ Identificador no válido';
  }

  // Error de validación de campos obligatorios en Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Error de clave duplicada en Mongo (por ejemplo, correo ya existente: código 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `🚫 El campo '${field}' ya está registrado`;
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
import { AppError } from './AppError.js';

export class BadRequestError extends AppError {
  constructor(message = '❌ Petición no válida') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '❌ No autenticado o credenciales inválidas') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '⛔️ No tienes permiso para realizar esta acción') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = '⁉️ Recurso no encontrado') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = '‼️ Conflicto con el estado actual del recurso') {
    super(message, 409);
  }
}
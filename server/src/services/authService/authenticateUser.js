import { User } from '../../models/User.js';
import { sanitizeUserResponse } from './sanitizeUserResponse.js';
import { ERROR_MESSAGES, UnauthorizedError } from '../../utils/errors/index.js';

// Autenticar un usuario existente en la base de datos
export const authenticateUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !(await user.matchPassword(password))) {
    // const error = new Error('⛔️ Credenciales inválidas');
    // error.statusCode = 401;
    // throw error;
    throw new UnauthorizedError(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  return sanitizeUserResponse(user);
};
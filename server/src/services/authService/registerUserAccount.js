import { User } from '../../models/User.js';
import { sanitizeUserResponse } from './sanitizeUserResponse.js';

// Registrar un nuevo usuario en la base de datos
export const registerUserAccount = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    // Lanzar un error si el correo electrónico ya está registrado
    const error = new Error('⛔️ Utilice otro correo electrónico');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });

  return sanitizeUserResponse(user);
};
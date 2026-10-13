import { generateToken } from '../../utils/generateToken.js';
import { registerUserAccount } from '../../services/authService/index.js';

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('🙏🏻 Por favor completa todos los campos requeridos');
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error('❌ La contraseña debe tener al menos 6 caracteres');
    }

    const sanitizedUser = await registerUserAccount({ name, email, password });

    res.status(201).json({
      status: 'success',
      data: {
        user: sanitizedUser,
        token: generateToken(sanitizedUser._id),
      },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};
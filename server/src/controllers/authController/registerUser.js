import { generateToken } from '../../utils/generateToken.js';
import { registerUserAccount } from '../../services/authService/index.js';
import { ERROR_MESSAGES, BadRequestError } from '../../utils/errors/index.js';

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      // res.status(400);
      // throw new Error('🙏🏻 Por favor completa todos los campos requeridos');
      throw new BadRequestError(ERROR_MESSAGES.AUTH.MISSING_FIELDS);
    }

    if (password.length < 6) {
      // res.status(400);
      // throw new Error('❌ La contraseña debe tener al menos 6 caracteres');
      throw new BadRequestError(ERROR_MESSAGES.AUTH.PASSWORD_TOO_SHORT);
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
    // if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};
import { generateToken } from '../../utils/generateToken.js';
import { authenticateUser } from '../../services/authService/index.js';

// @desc    Iniciar sesión / Login
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('🙏🏻 Por favor proporciona email y contraseña');
    }

    const sanitizedUser = await authenticateUser({ email, password });

    res.status(200).json({
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
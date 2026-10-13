import { sanitizeUserResponse } from '../../services/authService/index.js';

// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: sanitizeUserResponse(req.user),
      },
    });
  } catch (error) {
    next(error);
  }
};
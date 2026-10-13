import { User } from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validación básica de entrada
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('🙏🏻 Por favor completa todos los campos requeridos');
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error('❌ La contraseña debe tener al menos 6 caracteres');
    }

    // Comprobar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('⛔️ Ya existe una cuenta con ese correo electrónico');
    }

    // Crear usuario
    const user = await User.create({ name, email, password });

    res.status(201).json({
      status: 'success',
      data: {
        user,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

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

    // Buscar usuario
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        status: 'success',
        data: {
          user,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401);
      throw new Error('⛔️ Credenciales inválidas');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener perfil del usuario autenticado (verificar sesión)
// @route   GET /api/auth/me
// @access  Private (requiere protect middleware)
export const getMe = async (req, res, next) => {
  try {
    // req.user ya viene inyectado por el middleware protect
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};
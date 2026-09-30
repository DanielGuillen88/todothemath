import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Entrada de usuario autenticado en la petición (sin exponer la contraseña)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Usuario no encontrado');
      }

      return next();
    } catch (error) {
      res.status(401);
      return next(new Error('No autorizado, token fallido o expirado'));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('No autorizado, falta el token de acceso'));
  }
};
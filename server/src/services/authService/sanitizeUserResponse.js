/**
 * Garantiza que ningún endpoint de autenticación devuelva hashes, tokens internos o campos indeseados
 * Normaliza y elimina campos sensibles de un documento de usuario 
* @param {Object} user 
 * @returns {Object}
 */
export const sanitizeUserResponse = (user) => {
  if (!user) return null;

  const rawUser = user.toObject ? user.toObject() : { ...user };
  delete rawUser.password;
  delete rawUser.__v;

  return {
    _id: rawUser._id,
    id: rawUser._id,
    name: rawUser.name,
    email: rawUser.email,
    createdAt: rawUser.createdAt,
    updatedAt: rawUser.updatedAt,
  };
};
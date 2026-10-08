/**
 * Calcula el array splitBetween en base a si es gasto personal o compartido
 */
export const buildExpenseSplit = (amount, isPersonal, userId, projectMembers = [], customSplit) => {
  const numAmount = Number(amount);
  const cleanUserId = String(userId?._id || userId?.id || userId);

  // Si es personal, el 100% de la cuota le corresponde al usuario
  if (Boolean(isPersonal)) {
    return [{ user: cleanUserId, share: numAmount }];
  }

  // Si el cliente envía una partición personalizada ya configurada
  if (Array.isArray(customSplit) && customSplit.length > 0) {
    return customSplit.map((item) => ({
      user: String(item.user?._id || item.user?.id || item.user),
      share: Number(item.share)
    }));
  }

  // Por defecto: división equitativa entre todos los participantes del proyecto
  const membersCount = projectMembers.length || 1;
  const sharePerMember = Number((numAmount / membersCount).toFixed(2));

  return projectMembers.map((member) => {
    // Extraer solo el ID limpio tanto si member es string como si es un objeto poblado
    const memberId = String(member?._id || member?.id || member);
    return {
      user: memberId,
      share: sharePerMember,
    };
  });
};
import mongoose from 'mongoose';
import { Settlement } from '../../models/Settlement.js';
import { Project } from '../../models/Project.js';
import { hasProjectAccess } from '../../services/projectService/index.js';
import { BadRequestError, NotFoundError, ForbiddenError, ERROR_MESSAGES } from '../../utils/errors/index.js';

// @desc    Registrar un pago/liquidación entre miembros
// @route   POST /api/projects/:projectId/settlements
export const createSettlement = async (req, res, next) => {
  try {
    // 1. Soporte dual para :projectId o :id según el router padre
    const projectId = req.params.projectId || req.params.id;
    const { from, to, amount, method, note } = req.body;
    const currentUserId = String(req.user._id);

    // 2. Validar que from y to sean ObjectIds válidos de MongoDB
    if (!mongoose.Types.ObjectId.isValid(from) || !mongoose.Types.ObjectId.isValid(to)) {
      return next(new BadRequestError(ERROR_MESSAGES.EXPENSE.INVALID_PAID_BY));
    }

    const numericAmount = Number(amount);
    if (!from || !to || isNaN(numericAmount) || numericAmount <= 0) {
      return next(new BadRequestError(ERROR_MESSAGES.EXPENSE.INVALID_AMOUNT));
    }

    if (String(from) === String(to)) {
      return next(new BadRequestError(ERROR_MESSAGES.EXPENSE.INVALID_PAID_BY));
    }

    // 3. Verificar existencia del proyecto
    const project = await Project.findById(projectId);
    if (!project) return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));

    if (!hasProjectAccess(project, req.user._id)) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_ACCESS));
    }

    // 4. Comprobación exhaustiva de pertenencia (soportando ObjectIds y objetos poblados)
    const isMemberOrOwner = (userId) => {
      const targetId = String(userId);
      const ownerId = String(project.owner?._id || project.owner);
      const isOwner = ownerId === targetId;
      const isMember = (project.members || []).some((m) => {
        const memberId = String(m?._id || m?.id || m);
        return memberId === targetId;
      });
      return isOwner || isMember;
    };

    if (!isMemberOrOwner(from) || !isMemberOrOwner(to)) {
      return next(new BadRequestError(ERROR_MESSAGES.EXPENSE.INVALID_PAID_BY));
    }

    // 5. Control de permisos: solo los involucrados o el creador del proyecto pueden registrarlo
    const ownerId = String(project.owner?._id || project.owner);
    const isOwner = ownerId === currentUserId;
    const isParty = currentUserId === String(from) || currentUserId === String(to);

    if (!isOwner && !isParty) {
      return next(new ForbiddenError(ERROR_MESSAGES.EXPENSE.FORBIDDEN_ACTION));
    }

    // 6. Creación y poblado del registro
    const settlement = await Settlement.create({
      project: projectId,
      from,
      to,
      amount: Number(numericAmount.toFixed(2)),
      method: method || 'bizum',
      note: note ? note.trim() : '',
    });

    const populated = await Settlement.findById(settlement._id)
      .populate('from', 'name email')
      .populate('to', 'name email');

    res.status(201).json({
      status: 'success',
      data: { settlement: populated },
    });
  } catch (error) {
    next(error);
  }
};
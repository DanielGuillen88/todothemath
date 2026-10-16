import { Expense } from '../../models/Expense.js';
import { Project } from '../../models/Project.js';
import { buildExpenseSplit, canModifyExpense } from '../../services/expenseService/index.js';
import { ERROR_MESSAGES, BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors/index.js';

// @desc    Actualizar un gasto
// @route   PUT /api/projects/:projectId/expenses/:expenseId
// @access  Private

export const updateExpense = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const { expenseId } = req.params;
    const { title, amount, category, date, isPersonal, splitBetween, paidBy } = req.body;

    const [expense, project] = await Promise.all([
      Expense.findOne({ _id: expenseId, project: projectId }),
      Project.findById(projectId)
    ]);

    if (!expense) {
      throw new NotFoundError(ERROR_MESSAGES.EXPENSE.NOT_FOUND);
    }

    if (!project) {
      throw new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND);
    }

    if (!canModifyExpense(expense, project, req.user._id)) {
      throw new ForbiddenError(ERROR_MESSAGES.EXPENSE.FORBIDDEN_ACTION);
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        throw new BadRequestError(ERROR_MESSAGES.EXPENSE.INVALID_TITLE);
      }

      expense.title = title.trim();
    }

    if (category !== undefined) {
      if (typeof category !== 'string' || !category.trim()) {
        throw new BadRequestError(ERROR_MESSAGES.EXPENSE.INVALID_CATEGORY);
      }

      expense.category = category;
    }

    if (date !== undefined) {
      if (Number.isNaN(Date.parse(date))) {
        throw new BadRequestError(ERROR_MESSAGES.EXPENSE.INVALID_DATE);
      }

      expense.date = date;
    }
    
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new BadRequestError(ERROR_MESSAGES.EXPENSE.INVALID_AMOUNT);
      }
      expense.amount = numAmount;
    }

  //   if (paidBy !== undefined) {
  // const cleanPaidBy = paidBy?._id ?? paidBy?.id ?? paidBy;

  // if (
  //     cleanPaidBy === null ||
  //     typeof cleanPaidBy === 'object' ||
  //     String(cleanPaidBy).trim() === ''
  //     ) {
  //       throw new BadRequestError(
  //         ERROR_MESSAGES.EXPENSE.INVALID_PAID_BY
  //       );
  //     }

  //     expense.paidBy = String(cleanPaidBy);
  //   }
  if (paidBy !== undefined && paidBy !== null) {
      let rawId = paidBy;

      // Si viene como objeto, buscar el ID en sus posibles propiedades
      if (typeof paidBy === 'object') {
        rawId = paidBy._id || paidBy.id || paidBy.value || '';
      }

      const cleanPaidBy = String(rawId || '').trim();

      // Rechazar si no es un ObjectId válido de Mongo (24 caracteres hex) o es "[object Object]"
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(cleanPaidBy);

      if (!isValidObjectId) {
        throw new BadRequestError(
          ERROR_MESSAGES.EXPENSE?.INVALID_PAID_BY || 'El pagador seleccionado no es válido'
        );
      }

      expense.paidBy = cleanPaidBy;
    }

    if (isPersonal !== undefined) {
      if (typeof isPersonal !== 'boolean') {
        throw new BadRequestError(
          ERROR_MESSAGES.EXPENSE.INVALID_IS_PERSONAL
        );
      }

      expense.isPersonal = isPersonal;
    }

    // Extraer solo el ID de quien paga para el cálculo de reparto
    const payerId = String(expense.paidBy?._id || expense.paidBy?.id || expense.paidBy);
    // Si no se envía splitBetween nuevo, preservar los participantes que ya tenía el gasto
    const currentSplitPayload = splitBetween !== undefined ? splitBetween : expense.splitBetween;

    expense.splitBetween = buildExpenseSplit(
      expense.amount,
      expense.isPersonal,
      payerId,
      project.members,
      currentSplitPayload
    );

    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splitBetween.user', 'name email');

    res.status(200).json({
      status: 'success',
      data: { expense: populatedExpense },
    });
  } catch (error) {
    next(error);
  }
};
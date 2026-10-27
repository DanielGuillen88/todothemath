// @desc    Eliminar un miembro de un proyecto
// @route   DELETE /api/projects/:id/members/:memberId
// @access  Private
export const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, memberId } = req.params;
    const currentUserId = req.user._id.toString();

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new NotFoundError(ERROR_MESSAGES.PROJECT.NOT_FOUND));
    }

    // 1. Solo el creador/propietario puede expulsar miembros
    if (project.owner.toString() !== currentUserId) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_MANAGE_MEMBERS));
    }

    // 2. El dueño no puede autoexpulsarse por esta vía
    if (project.owner.toString() === memberId) {
      return next(new ForbiddenError(ERROR_MESSAGES.PROJECT.FORBIDDEN_REMOVE_OWNER));
    }

    // 3. Comprobar que el usuario pertenece al proyecto
    const isMember = project.members.some((m) => m.toString() === memberId);
    if (!isMember) {
      return next(new BadRequestError(ERROR_MESSAGES.PROJECT.NOT_MEMBER));
    }

    // 4. Verificación de integridad financiera:
    // ¿Pagó algún gasto en este proyecto?
    const paidExpensesCount = await Expense.countDocuments({
      project: projectId,
      paidBy: memberId,
    });

    if (paidExpensesCount > 0) {
      return next(
        new BadRequestError(
          'No se puede expulsar a este participante porque figura como pagador de gastos registrados. Edita o elimina sus gastos primero.'
        )
      );
    }

    // ¿Forma parte del reparto (splitBetween) de algún gasto compartido?
    const splitExpensesCount = await Expense.countDocuments({
      project: projectId,
      isPersonal: false,
      'splitBetween.user': memberId,
    });

    if (splitExpensesCount > 0) {
      return next(
        new BadRequestError(
          'No se puede expulsar a este participante porque tiene gastos compartidos asignados. Reasigna los repartos antes de continuar.'
        )
      );
    }

    // ¿Tiene liquidaciones registradas (pagadas o recibidas)?
    const settlementsCount = await Settlement.countDocuments({
      project: projectId,
      $or: [{ from: memberId }, { to: memberId }],
    });

    if (settlementsCount > 0) {
      return next(
        new BadRequestError(
          'No se puede expulsar a este participante porque tiene liquidaciones registradas en el historial. Deshaz los pagos en la pestaña de liquidaciones primero.'
        )
      );
    }

    // 5. Eliminar del array de miembros
    project.members = project.members.filter((m) => m.toString() !== memberId);
    await project.save();

    // 6. Devolvemos el proyecto poblado
    const updatedProject = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.json({
      status: 'success',
      message: '✅ Miembro eliminado con éxito',
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};
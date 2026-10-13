import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { Expense } from '../models/Expense.js';

// @desc    Crear un nuevo proyecto (viaje, evento, reforma)
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res, next) => {
  try {
    const { title, description, type, budget, currency } = req.body;

    if (!title) {
      res.status(400);
      throw new Error('😅 El título del proyecto es obligatorio');
    }

    const project = await Project.create({
      title,
      description,
      type: type || 'trip',
      budget: budget || 0,
      currency: currency || 'EUR',
      owner: req.user._id,
      members: [req.user._id] // El creador se añade automáticamente como participante
    });

    res.status(201).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener todos los proyectos del usuario autenticado
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }]
    })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: { projects }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener detalle de un proyecto por ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ status: 'fail', message: 'Proyecto no encontrado' });
    }

    const currentUserId = req.user._id.toString();
    const ownerId = String(project.owner?._id || project.owner || '');

    // Comprobación segura de membresía
    const isMember = Array.isArray(project.members) && project.members.some((m) => {
      const mId = String(m?._id || m?.id || m);
      return mId === currentUserId;
    });

    const isOwner = ownerId === currentUserId;

    if (!isMember && !isOwner) {
      return res.status(403).json({ status: 'fail', message: 'No tienes acceso a este proyecto' });
    }

    res.status(200).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Añadir un participante al proyecto por email
// @route   POST /api/projects/:id/members
// @access  Private
export const addMemberToProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Debes indicar el email del participante.');
    }

    const project = await Project.findById(id);
    if (!project) {
      res.status(404);
      throw new Error('Proyecto no encontrado.');
    }

    // Comprobar que quien invita sea miembro o el creador
    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    const isOwner = project.owner.toString() === req.user._id.toString();

    if (!isMember && !isOwner) {
      res.status(403);
      throw new Error('No tienes permisos para añadir miembros a este proyecto.');
    }

    // Buscar al usuario registrado por email
    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      res.status(404);
      throw new Error('No existe ningún usuario registrado con ese email.');
    }

    // Comprobar si ya forma parte del proyecto
    const alreadyMember = project.members.some(
      (m) => m.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      res.status(400);
      throw new Error('El usuario ya forma parte de este proyecto.');
    }

    project.members.push(userToAdd._id);
    await project.save();

    // Devolvemos el proyecto poblado con owner y members
    const updatedProject = await Project.findById(id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'Participante añadido correctamente.',
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ status: 'fail', message: 'ID de proyecto no válido' });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ status: 'fail', message: 'Proyecto no encontrado' });
    }

    const currentUserId = req.user._id.toString();
    const ownerId = String(project.owner?._id || project.owner || '');

    if (ownerId !== currentUserId) {
      return res.status(403).json({
        status: 'fail',
        message: 'No tienes permisos para editar este proyecto'
      });
    }

    const { title, description, budget, currency, type } = req.body;
    if (title) project.title = title.trim();
    if (description !== undefined) project.description = description;
    if (budget !== undefined) project.budget = Number(budget) || 0;
    if (currency) project.currency = currency;
    if (type) project.type = type;

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.status(200).json({
      status: 'success',
      data: { project: updated }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar un proyecto y sus gastos asociados
// @route   DELETE /api/projects/:id
// @access  Private (Solo el creador)
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ status: 'fail', message: 'Proyecto no encontrado' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'No tienes permisos para eliminar este proyecto (solo el creador puede hacerlo)'
      });
    }

    // Eliminar gastos asociados antes de borrar el proyecto
    await Expense.deleteMany({ project: project._id });
    await project.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Proyecto y gastos asociados eliminados correctamente'
    });
  } catch (error) {
    next(error);
  }
};
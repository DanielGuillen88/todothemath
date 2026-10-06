import { User } from '../models/User.js';
import { Project } from '../models/Project.js';

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
export const getMyProjects = async (req, res, next) => {
  try {
    // Proyectos donde el usuario es el dueño o es miembro
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
      res.status(404);
      throw new Error('😵 Proyecto no encontrado');
    }

    // Verificar que el usuario pertenece al proyecto
    const isMember = project.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );

    if (!isMember && project.owner._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('⛔️ No tienes acceso a este proyecto');
    }

    res.status(200).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Añadir un miembro al proyecto por correo electrónico
// @route   POST /api/projects/:id/members
// @access  Private (Solo el owner)
export const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Debes indicar el email del usuario a añadir ‼️');
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('😵 Proyecto no encontrado');
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('⛔️ Solo el creador del proyecto puede añadir miembros');
    }

    // Buscar si el usuario registrado existe
    const { User } = await import('../models/User.js');
    const userToAdd = await User.findOne({ email });

    if (!userToAdd) {
      res.status(404);
      throw new Error('🙃 No existe ningún usuario registrado con ese email');
    }

    // Comprobar que no esté ya añadido
    if (project.members.includes(userToAdd._id)) {
      res.status(400);
      throw new Error('👤 El usuario ya forma parte de este proyecto');
    }

    project.members.push(userToAdd._id);
    await project.save();

    res.status(200).json({
      status: 'success',
      message: 'Miembro añadido con éxito ✅',
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

    // Comprobar que quien invita sea miembro o creador
    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      throw new Error('No tienes permisos para añadir miembros a este proyecto.');
    }

    // Buscar al usuario por email
    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      res.status(404);
      throw new Error('No existe ningún usuario registrado con ese email.');
    }

    // Comprobar si ya es miembro
    const alreadyMember = project.members.some(
      (m) => m.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      res.status(400);
      throw new Error('El usuario ya forma parte de este proyecto.');
    }

    project.members.push(userToAdd._id);
    await project.save();

    const updatedProject = await Project.findById(id)
      .populate('members', 'name email')
      .populate('creator', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'Participante añadido correctamente.',
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};
import express from 'express';
import { 
  createProject, 
  getProjects, 
  getProjectById, 
  updateProject, 
  deleteProject, 
  addMemberToProject,
  acceptInvitation,
  rejectInvitation
} from '../controllers/projectController/index.js';
import { removeMember } from '../controllers/projectController/removeMember.js';
import { protect } from '../middlewares/auth.js';

// Subrutas anidadas
import expenseRouter from './expenseRoutes.js';
import settlementRouter from './settlementRoutes.js';

const router = express.Router();

// Todas las rutas de proyectos requieren sesión activa
router.use(protect);

// 1. Reenvío anidado de sub-recursos heredando :projectId
router.use('/:projectId/expenses', expenseRouter);
router.use('/:projectId/settlements', settlementRouter);

// 2. Rutas base de proyectos
router
  .route('/')
  .get(getProjects)
  .post(createProject);

router
  .route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

// 3. Gestión de miembros
router.post('/:id/members', addMemberToProject);
router.delete('/:id/members/:memberId', removeMember);

// 4. Respuesta a invitaciones
router.post('/:id/invitations/accept', acceptInvitation);
router.post('/:id/invitations/reject', rejectInvitation);

export default router;
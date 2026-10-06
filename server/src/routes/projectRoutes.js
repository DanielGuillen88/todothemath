import { Router } from 'express';
import {
  createProject,
  getMyProjects,
  getProjectById,
  addMember,
} from '../controllers/projectController.js';
import expenseRoutes from './expenseRoutes.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

// Todas las rutas de proyectos son privadas y seguras con JWT
router.use(protect);

// Rutas anidadas para gastos de un proyecto
router.use('/:projectId/expenses', expenseRoutes);

router.route('/')
  .post(createProject)
  .get(getMyProjects);

router.route('/:id')
  .get(getProjectById);

router.route('/:id/members')
  .post(addMember);

export default router;
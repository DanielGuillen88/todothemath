import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMemberToProject,
} from '../controllers/projectController.js';
import { protect } from '../middlewares/auth.js';

// 1. IMPORTAR el router de gastos
import expenseRouter from './expenseRoutes.js'; // o './expenseRouter.js' según tu nombre de archivo

const router = express.Router();

router.use(protect);

// 2. REENVIAR /:projectId/expenses al router de gastos
// Esto permite que /api/projects/:id/expenses y /api/projects/:id/expenses/balances funcionen
router.use('/:projectId/expenses', expenseRouter);
// Por si en algún sitio se nombró :id en lugar de :projectId:
router.use('/:id/expenses', expenseRouter);

// Rutas base de proyectos
router
  .route('/')
  .get(getProjects)
  .post(createProject);

router
  .route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

router.post('/:id/members', addMemberToProject);

export default router;
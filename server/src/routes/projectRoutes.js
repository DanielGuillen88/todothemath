import express from 'express';
import { createProject, getProjects, getProjectById, updateProject, deleteProject, addMemberToProject } from '../controllers/projectController/index.js';
import { protect } from '../middlewares/auth.js';
import expenseRouter from './expenseRoutes.js';

const router = express.Router();

// requiere estar logueado para acceder a las rutas de proyectos
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
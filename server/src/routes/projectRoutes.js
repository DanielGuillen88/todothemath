import { Router } from 'express';
import {
  createProject,
  getMyProjects,
  getProjectById,
  addMember
} from '../controllers/projectController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

// Todas las rutas de proyectos son privadas y seguras con JWT
router.use(protect);

router.route('/')
  .post(createProject)
  .get(getMyProjects);

router.route('/:id')
  .get(getProjectById);

router.route('/:id/members')
  .post(addMember);

export default router;
import express from 'express';
import { 
  createSettlement, 
  getProjectSettlements, 
  deleteSettlement 
} from '../controllers/settlementController/index.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router({ mergeParams: true });

router.use(protect); // Todas las operaciones requieren autenticación

router.route('/')
  .get(getProjectSettlements)
  .post(createSettlement);

router.route('/:settlementId')
  .delete(deleteSettlement);

export default router;
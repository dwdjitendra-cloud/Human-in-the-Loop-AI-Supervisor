import express from 'express';
import {
  registerSupervisor,
  loginSupervisor,
  getAllSupervisors,
  getSupervisorById,
} from '../controllers/supervisorController.js';

const router = express.Router();

router.post('/register', registerSupervisor);
router.post('/login', loginSupervisor);
router.get('/', getAllSupervisors);
router.get('/:id', getSupervisorById);

export default router;

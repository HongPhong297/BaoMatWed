import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getCredentials,
  addCredential,
  editCredential,
  removeCredential,
  getCredential
} from '../controllers/credentialsController.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getCredentials);
router.get('/:id', getCredential);

// These routes only require authentication (JWT)
router.post('/', addCredential);
router.put('/:id', editCredential);
router.delete('/:id', removeCredential);

export default router;
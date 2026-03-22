import { Router } from 'express';
import { register, login, getSalt } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/get-salt', getSalt);

export default router;
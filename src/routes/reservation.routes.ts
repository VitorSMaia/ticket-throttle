import { Router } from 'express';
import { ReservationController } from '../controllers/ReservationController.js';

const router = Router();

router.post('/', ReservationController.reserve);

export default router;

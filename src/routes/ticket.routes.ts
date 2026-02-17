import { Router } from 'express';
import { TicketController } from '../controllers/TicketController.js';

const router = Router();

router.get('/', TicketController.list);
router.post('/batch', TicketController.createBatch);

export default router;

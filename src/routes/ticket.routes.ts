import { Router } from 'express';
import { TicketController } from '../controllers/TicketController.js';
import { idempotencyShield } from '../middlewares/idempotency.js';

const router = Router();

router.get('/', TicketController.list);
router.get('/events', TicketController.listEvents);
router.post('/batch', TicketController.createBatch);

// Endpoint de Reserva com Stripe e Expiração
router.post('/reserve', idempotencyShield, TicketController.reserveTicket);

// Endpoint de Checkout (Carrinho por Evento)
router.post('/checkout', idempotencyShield, TicketController.checkout);

// Endpoint para buscar itens no carrinho (Reservas Ativas)
router.get('/cart/:userId', TicketController.listCart);

// Endpoint para buscar ingressos pagos (Meus Ingressos)
router.get('/paid/:userId', TicketController.listPaidTickets);

export default router;

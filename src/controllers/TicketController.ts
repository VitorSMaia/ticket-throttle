import type { Request, Response } from 'express';
import { dataSource } from '../config/db.js';
import { Ticket } from '../entities/Ticket.js';
import { createPaymentIntent } from '../services/stripe.service.js';
import { addTicketToQueue, scheduleExpirationCheck } from '../config/queue.js';

export class TicketController {
    static async list(req: Request, res: Response) {
        const tickets = await dataSource.getRepository(Ticket).find({
            where: { status: 'AVAILABLE' },
            select: ['id', 'event_name', 'status', 'price']
        });
        res.json(tickets);
    }

    static async listEvents(req: Request, res: Response) {
        const events = await dataSource.getRepository(Ticket)
            .createQueryBuilder('ticket')
            .select('ticket.event_name', 'event_name')
            .addSelect('ticket.price', 'price')
            .addSelect('COUNT(*)', 'available')
            .where('ticket.status = :status', { status: 'AVAILABLE' })
            .groupBy('ticket.event_name')
            .addGroupBy('ticket.price')
            .getRawMany();

        res.json(events.map((e: any) => ({
            event_name: e.event_name,
            price: Number(e.price),
            available: Number(e.available),
        })));
    }

    static async createBatch(req: Request, res: Response) {
        const { eventName, quantity } = req.body;

        if (!eventName || !quantity || quantity <= 0) {
            return res.status(400).json({ error: "Nome do evento e quantidade válida são obrigatórios." });
        }

        try {
            const ticketRepo = dataSource.getRepository(Ticket);
            const ticketsToCreate = [];

            for (let i = 0; i < quantity; i++) {
                ticketsToCreate.push({
                    event_name: eventName,
                    status: 'AVAILABLE' as const,
                    price: 50.00
                });
            }

            await ticketRepo.insert(ticketsToCreate);

            return res.status(201).json({
                message: `${quantity} ingressos gerados com sucesso para o evento ${eventName}.`
            });
        } catch (error) {
            console.error("Erro ao gerar ingressos:", error);
            return res.status(500).json({ error: "Erro interno ao gerar ingressos." });
        }
    }

    static async checkout(req: Request, res: Response) {
        const { userId, items } = req.body; // items: { eventName, quantity, price }[]

        if (!userId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Carrinho inválido ou vazio." });
        }

        try {
            console.log(`-> Recebido checkout com ${items.length} evento(s).`);

            const result = await dataSource.transaction(async (em) => {
                const reservedTicketIds: string[] = [];
                let totalAmount = 0;

                // Para cada evento no carrinho, selecionar N tickets com LOCK
                for (const item of items) {
                    const availableTickets = await em.find(Ticket, {
                        where: { event_name: item.eventName, status: 'AVAILABLE' },
                        take: item.quantity,
                        select: ['id', 'price'],
                        lock: { mode: 'pessimistic_write' },
                    });

                    if (availableTickets.length < item.quantity) {
                        throw { status: 409, message: `Apenas ${availableTickets.length} ingressos disponíveis para "${item.eventName}".` };
                    }

                    for (const ticket of availableTickets) {
                        reservedTicketIds.push(ticket.id);
                        totalAmount += Number(ticket.price);
                    }
                }

                // Criar PaymentIntent único para o carrinho inteiro
                const paymentIntent = await createPaymentIntent(totalAmount, 'brl', {
                    userId,
                    ticketIds: reservedTicketIds.join(','),
                    itemCount: reservedTicketIds.length.toString(),
                    description: `Compra de ${reservedTicketIds.length} ingressos`
                });

                // Reservar tickets atomicamente dentro da mesma transação
                for (const ticketId of reservedTicketIds) {
                    await em.update(Ticket, ticketId, {
                        status: 'RESERVED',
                        userId,
                        reservedAt: new Date(),
                    });
                }

                console.log("-> PaymentIntent (Checkout) criado:", paymentIntent.id);

                // Agendar expiração para cada ticket (fora da transação está ok)
                for (const ticketId of reservedTicketIds) {
                    await scheduleExpirationCheck(ticketId);
                }

                console.log(`-> ${reservedTicketIds.length} ingressos reservados e agendados.`);

                return {
                    clientSecret: paymentIntent.client_secret,
                    paymentIntentId: paymentIntent.id,
                    total: totalAmount,
                    ticketCount: reservedTicketIds.length,
                    expiresIn: '15 minutes'
                };
            });

            return res.status(202).json(result);

        } catch (error: any) {
            if (error?.status === 409) {
                return res.status(409).json({ error: error.message });
            }
            console.error("Erro no checkout:", error);
            return res.status(500).json({ error: "Erro interno ao processar checkout." });
        }
    }

    static async reserveTicket(req: Request, res: Response) {
        const { userId, ticketId, price } = req.body;

        if (!userId || !ticketId || !price) {
            return res.status(400).json({ error: "Faltam dados: userId, ticketId ou price" });
        }

        try {
            console.log("-> Recebida requisição de reserva");
            // 1. Criamos a intenção de pagamento no Stripe
            const paymentIntent = await createPaymentIntent(price, 'brl', { ticketId, userId });
            console.log("-> PaymentIntent criado:", paymentIntent.id);

            // 2. Colocamos na fila com o status "PENDING_PAYMENT"
            // Passamos o paymentIntent.id para o worker conseguir validar depois (se necessário)
            await addTicketToQueue({
                userId,
                ticketId,
                paymentIntentId: paymentIntent.id
            });
            console.log("-> Adicionado à fila de reserva");

            // 3. AGENDA A EXPIRAÇÃO: Se em 15min não pagar, o bilhete volta para o sistema
            await scheduleExpirationCheck(ticketId);
            console.log("-> Verificação de expiração agendada");

            // 4. Retornamos o client_secret para o Front-end finalizar o pagamento
            return res.status(202).json({
                clientSecret: paymentIntent.client_secret,
                expiresIn: '15 minutes',
                message: "Pagamento iniciado. Aguardando confirmação."
            });
        } catch (error) {
            console.error("Erro na reserva:", error);
            return res.status(500).json({ error: "Erro interno ao processar reserva." });
        }
    }

    static async listCart(req: Request, res: Response) {
        const userId = req.params.userId as string;

        try {
            const ticketRepo = dataSource.getRepository(Ticket);
            const activeReservations = await ticketRepo.find({
                where: {
                    userId,
                    status: 'RESERVED'
                },
                select: ['id', 'event_name', 'price', 'reservedAt', 'updated_at']
            });

            return res.json(activeReservations);
        } catch (error) {
            console.error("Erro ao buscar carrinho:", error);
            return res.status(500).json({ error: "Erro ao buscar carrinho." });
        }
    }

    static async listPaidTickets(req: Request, res: Response) {
        const userId = req.params.userId as string;

        try {
            const ticketRepo = dataSource.getRepository(Ticket);
            const paidTickets = await ticketRepo.find({
                where: {
                    userId,
                    status: 'SOLD'
                },
                select: ['id', 'event_name', 'price', 'updated_at']
            });

            return res.json(paidTickets);
        } catch (error) {
            console.error("Erro ao buscar ingressos pagos:", error);
            return res.status(500).json({ error: "Erro ao buscar ingressos pagos." });
        }
    }
}

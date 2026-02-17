import type { Request, Response } from 'express';
import { dataSource } from '../config/db.js';
import { Ticket } from '../entities/Ticket.js';

export class TicketController {
    static async list(req: Request, res: Response) {
        const tickets = await dataSource.getRepository(Ticket).find({
            where: { status: 'AVAILABLE' }
        });
        res.json(tickets);
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
                    status: 'AVAILABLE'
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
}

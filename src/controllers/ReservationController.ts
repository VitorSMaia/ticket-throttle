import type { Request, Response } from 'express';
import { addTicketToQueue } from '../config/queue.js';

export class ReservationController {
    static async reserve(req: Request, res: Response) {
        const { userId, ticketId } = req.body;

        if (!userId || !ticketId) {
            return res.status(400).json({ error: "Faltam dados: userId ou ticketId" });
        }

        await addTicketToQueue({ userId, ticketId });

        return res.status(202).json({
            message: "Sua reserva está sendo processada.",
            ticketId
        });
    }
}

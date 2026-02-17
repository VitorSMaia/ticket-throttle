import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

import "dotenv/config";

// Conexão com o Redis (crucial para alta performance no MASP
const connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null
});


export const ticketQueue = new Queue('TicketReservations', { connection: connection as any });

export const addTicketToQueue = async (data: { userId: string, ticketId: string, paymentIntentId?: string }) => {
    return await ticketQueue.add('reservation', data, {
        removeOnComplete: true,
        removeOnFail: false
    });
};

// Adiciona um trabalho com atraso (delay)
export async function scheduleExpirationCheck(ticketId: string) {
    await ticketQueue.add(
        'check-expiration',
        { ticketId },
        {
            delay: 15 * 60 * 1000, // 15 minutos em milissegundos
            removeOnComplete: true
        }
    );
}
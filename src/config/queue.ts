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

export async function addTicketToQueue(data: { userId: string, ticketId: string }) {
    await ticketQueue.add('reserve', data, {
        attempts: 3, // Retry automático em caso de falha no banco/gateway
        backoff: { type: 'exponential', delay: 1000 }
    });
}
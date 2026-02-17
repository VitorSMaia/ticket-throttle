import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

// Conexão com o Redis (crucial para alta performance no MASP
const connection = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null
});


export const ticketQueue = new Queue('TicketReservations', { connection: connection as any });

export async function addTicketToQueue(data: { userId: string, ticketId: string }) {
    await ticketQueue.add('reserve', data, {
        attempts: 3, // Retry automático em caso de falha no banco/gateway
        backoff: { type: 'exponential', delay: 1000 }
    });
}
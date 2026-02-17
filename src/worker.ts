import "reflect-metadata";
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { dataSource, initDb } from './config/db.js'; // Assumindo que você configurou o TypeORM/DataSource
import { Ticket } from './entities/Ticket.js';

// 0. Inicializa o banco de dados antes de tudo
initDb();

const connection = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null
});

const ticketWorker = new Worker('TicketReservations', async (job: Job) => {
    const { userId, ticketId } = job.data;

    console.log(`[Worker] Processando reserva: Usuário ${userId}, Ingresso ${ticketId}`);

    // Usando Transação para garantir consistência (Padrão Sênior)
    return await dataSource.transaction(async (transactionalEntityManager) => {

        // 1. Busca o ingresso com "Pessimistic Write Lock" (impede que outro processo leia/altere ao mesmo tempo)
        const ticket = await transactionalEntityManager.findOne(Ticket, {
            where: { id: ticketId, status: 'AVAILABLE' },
            lock: { mode: 'pessimistic_write' }
        });

        if (!ticket) {
            throw new Error(`Ingresso ${ticketId} não disponível ou já reservado.`);
        }

        // 2. Atualiza o status
        ticket.status = 'RESERVED';
        ticket.userId = userId;
        ticket.reservedAt = new Date();

        await transactionalEntityManager.save(ticket);

        // 3. Simula integração com Gateway (O que você fez no ConectePag seria aplicado aqui)
        console.log(`[Worker] Sucesso: Ingresso ${ticketId} reservado para ${userId}`);

        return { success: true, ticketId: ticket.id };
    });
}, { connection });

ticketWorker.on('failed', (job, err) => {
    console.error(`[Worker] Falha no Job ${job?.id}: ${err.message}`);
});

console.log('🚀 Worker de Ingressos rodando...');
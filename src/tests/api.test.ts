import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Ticket } from '../entities/Ticket.js';
import { IdempotencyKey } from '../entities/IdempotencyKey.js';
import { config } from 'dotenv';

config(); // Load env vars for DB connection

const API = process.env.VITE_API_URL || 'http://localhost:3000';
const TEST_EVENT = `LoadTest-${Date.now()}`;

// Direct DB connection for verification and cleanup
const testDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ticket_system',
    entities: [Ticket, IdempotencyKey],
    synchronize: false,
});

describe('🎟️ Ticket System Integrity Tests', () => {

    // Setup DB connection for tests
    beforeAll(async () => {
        if (!testDataSource.isInitialized) {
            await testDataSource.initialize();
        }
    });

    afterAll(async () => {
        if (testDataSource.isInitialized) {
            console.log(`🧹 Cleaning up test data for: ${TEST_EVENT}`);
            await testDataSource.getRepository(Ticket).delete({ event_name: TEST_EVENT });
            await testDataSource.destroy();
        }
    });

    it('should create batch tickets (Setup)', async () => {
        const res = await request(API).post('/tickets/batch').send({
            eventName: TEST_EVENT,
            quantity: 5
        });
        expect(res.status).toBe(201);
    });

    it('should return 409 when overselling (Race Condition)', async () => {
        const reqs = Array(5).fill(0).map(() =>
            request(API).post('/tickets/checkout').send({
                userId: 'tester@load.com',
                items: [{ eventName: TEST_EVENT, quantity: 2, price: 50 }]
            })
        );

        const responses = await Promise.all(reqs);
        const success = responses.filter(r => r.status === 202).length;
        const failed = responses.filter(r => r.status === 409).length;

        console.log(`Race Result: ${success} suc, ${failed} fail`);

        // Validation: 2 successes (4 tickets sold) and 3 failures (wanted 2, only 1 left)
        expect(success).toBe(2);
        expect(failed).toBeGreaterThanOrEqual(3);
    });

    it('should maintain stock integrity after race condition', async () => {
        // Validation via direct DB access for absolute certainty
        const remainingTickets = await testDataSource.getRepository(Ticket).count({
            where: { event_name: TEST_EVENT, status: 'AVAILABLE' }
        });

        console.log('Final Database Stock:', remainingTickets);
        expect(remainingTickets).toBe(1); // 5 total - 4 sold = 1 remaining
    });

    it('should block SQL Injection in inputs', async () => {
        const res = await request(API).post('/tickets/checkout').send({
            userId: "' OR '1'='1",
            items: [{ eventName: TEST_EVENT, quantity: 1, price: 50 }]
        });
        expect(res.status).not.toBe(500);
    });

    it('should not allow negative quantity', async () => {
        const res = await request(API).post('/tickets/checkout').send({
            userId: 'hacker',
            items: [{ eventName: TEST_EVENT, quantity: -10, price: 50 }]
        });
        expect(res.status).not.toBe(202);
    });

    it('should enforce Idempotency (Replay Attack)', async () => {
        const key = `idem-${Date.now()}`;
        const payload = {
            userId: 'replay@test.com',
            items: [{ eventName: TEST_EVENT, quantity: 1, price: 50 }]
        };

        const res1 = await request(API).post('/tickets/checkout')
            .set('x-idempotency-key', key)
            .send(payload);

        const res2 = await request(API).post('/tickets/checkout')
            .set('x-idempotency-key', key)
            .send(payload);

        expect(res1.status).toBe(res2.status);
    });
});

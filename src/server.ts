import "reflect-metadata";
import cors from 'cors';
import express from 'express';
import { initDb } from './config/db.js';
import ticketRoutes from './routes/ticket.routes.js';
import { webhookRouter } from './routes/webhooks.js';

const app = express();
app.use(cors()); // Permite requisições do seu front-end Vite

// Webhooks devem vir ANTES do express.json() porque o Stripe precisa do body raw
app.use('/webhooks', webhookRouter);

app.use(express.json());

const startServer = async () => {
    // Inicializa Banco de Dados
    await initDb();

    // Rotas
    app.use('/tickets', ticketRoutes);


    app.listen(3000, () => console.log('🔥 Server rodando na porta 3000'));
};

startServer();
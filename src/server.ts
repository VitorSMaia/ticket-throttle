import "reflect-metadata";
import cors from 'cors';
import express from 'express';
import { initDb } from './config/db.js';
import ticketRoutes from './routes/ticket.routes.js';
import reservationRoutes from './routes/reservation.routes.js';

const app = express();
app.use(cors()); // Permite requisições do seu front-end Vite
app.use(express.json());

// Inicializa Banco de Dados
initDb();

// Rotas
app.use('/tickets', ticketRoutes);
app.use('/reserve', reservationRoutes);

app.listen(3000, () => console.log('🔥 Server rodando na porta 3000'));
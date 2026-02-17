import { DataSource } from "typeorm";
import { Ticket } from "../entities/Ticket.js"; // Importe a classe diretamente
import { IdempotencyKey } from "../entities/IdempotencyKey.js";
import "dotenv/config";

export const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || "user",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "ticket_system",
    entities: [Ticket, IdempotencyKey], // Use a classe importada aqui
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
});

export const initDb = async () => {
    try {
        await dataSource.initialize();
        console.log("📁 Banco de dados conectado com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao conectar no banco:", error);
    }
};
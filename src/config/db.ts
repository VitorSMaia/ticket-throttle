import { DataSource } from "typeorm";
import { Ticket } from "../entities/Ticket.js"; // Importe a classe diretamente

export const dataSource = new DataSource({
    type: "postgres",
    host: "127.0.0.1",
    port: 5432,
    username: "user",
    password: "password",
    database: "ticket_system",
    entities: [Ticket], // Use a classe importada aqui
    synchronize: true,  // Isso cria as tabelas automaticamente
    logging: true,      // ATIVE ISSO para ver o SQL no terminal e saber se ele tentou criar a tabela
});

export const initDb = async () => {
    try {
        await dataSource.initialize();
        console.log("📁 Banco de dados conectado com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao conectar no banco:", error);
    }
};
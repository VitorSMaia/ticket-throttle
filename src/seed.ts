import "reflect-metadata";
import { dataSource } from './config/db.js';
import { Ticket } from './entities/Ticket.js';

async function seed() {
    console.log("⏳ Iniciando conexão com o banco...");
    try {
        await dataSource.initialize();
        console.log("✅ Conectado!");

        const ticketRepo = dataSource.getRepository(Ticket);

        const count = await ticketRepo.count();
        if (count > 0) {
            console.log("⚠️ Banco já populado. Limpando...");
            await ticketRepo.clear();
        }

        await ticketRepo.save([
            { event_name: 'MASP - Tarsila', status: 'AVAILABLE' },
            { event_name: 'MASP - Lina Bo Bardi', status: 'AVAILABLE' }
        ]);

        console.log('🚀 Sucesso! Ingressos criados.');
    } catch (err: any) {
        console.error("❌ ERRO DETALHADO:");
        console.error("Mensagem:", err.message);
        console.error("Código:", err.code); // Ver se é ECONNREFUSED
    } finally {
        if (dataSource.isInitialized) await dataSource.destroy();
        process.exit();
    }
}

seed();
import type { Request, Response, NextFunction } from 'express';
import { dataSource } from '../config/db.js';
import { IdempotencyKey } from '../entities/IdempotencyKey.js';

export const idempotencyShield = async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['x-idempotency-key'] as string;

    if (!key) return next(); // Se não enviou a chave, segue o fluxo normal (ou bloqueia, dependendo da regra)

    console.log(`🛡️ [Shield] Verificando chave: ${key}`);
    const repo = dataSource.getRepository(IdempotencyKey);
    const savedResponse = await repo.findOneBy({ key });
    console.log(`🛡️ [Shield] Chave encontrada: ${!!savedResponse}`);

    if (savedResponse) {
        console.log(`🛡️ [Shield] Chave duplicada detectada: ${key}. Retornando cache.`);
        return res.status(savedResponse.status_code).json(savedResponse.response_body);
    }

    // Intercepta o res.json para salvar a resposta antes de enviar
    const originalJson = res.json;
    res.json = function (body) {
        repo.save({
            key,
            response_body: body,
            status_code: res.statusCode
        }).catch(err => console.error("Erro ao salvar chave:", err));

        return originalJson.call(this, body);
    };

    next();
};

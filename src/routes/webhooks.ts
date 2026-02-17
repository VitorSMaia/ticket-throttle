import express from 'express';
import Stripe from 'stripe';
import { dataSource } from '../config/db.js';
import { Ticket } from '../entities/Ticket.js';
import { stripe } from '../services/stripe.service.js';

export const webhookRouter = express.Router();

// O Stripe precisa do body bruto (raw) para verificar a assinatura
// A rota será /webhooks/stripe (montada no server.ts)
webhookRouter.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
        // Valida a assinatura do webhook
        // Em produção, STRIPE_WEBHOOK_SECRET deve estar definido
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Se o pagamento foi concluído com sucesso
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`💰 Pagamento ${paymentIntent.id} aprovado!`);

        const ticketId = paymentIntent.metadata['ticketId'];
        const ticketIds = paymentIntent.metadata['ticketIds'];
        const userId = paymentIntent.metadata['userId'];

        if (ticketId) {
            // Pagamento de ingresso individual
            await dataSource.transaction(async (em) => {
                const ticket = await em.findOneBy(Ticket, { id: ticketId });
                if (ticket && ticket.status === 'RESERVED') {
                    ticket.status = 'SOLD';
                    await em.save(ticket);
                    console.log(`🎟️ Ingresso ${ticketId} VENDIDO!`);
                }
            });
        } else if (ticketIds) {
            // Pagamento de carrinho — usar ticketIds do metadata (não userId genérico)
            const ids = ticketIds.split(',');
            await dataSource.transaction(async (em) => {
                for (const id of ids) {
                    const ticket = await em.findOneBy(Ticket, { id, status: 'RESERVED' });
                    if (ticket) {
                        ticket.status = 'SOLD';
                        await em.save(ticket);
                        console.log(`🎟️ Ingresso ${ticket.id} VENDIDO (batch)!`);
                    }
                }
                console.log(`💰 ${ids.length} ingressos vendidos para ${userId}`);
            });
        }
    }

    res.json({ received: true });
});

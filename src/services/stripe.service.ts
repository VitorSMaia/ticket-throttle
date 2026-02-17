import Stripe from 'stripe';
import "dotenv/config";

// Use uma variável de ambiente em produção!
// Fallback para uma chave de teste fictícia caso não esteja no .env (para evitar erro no build), 
// mas o usuário deve fornecer a chave correta via .env
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-12-18.acacia', // Updated to a valid version or let it default
    typescript: true,
});

export const createPaymentIntent = async (amount: number, currency = 'brl', metadata: Record<string, any> = {}) => {
    return await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe trabalha com centavos e inteiros
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
            integration_check: 'masp_ticketing',
            ...metadata
        }
    });
};

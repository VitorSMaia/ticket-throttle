
import { createPaymentIntent } from '../src/services/stripe.service.js';
import "dotenv/config";

async function test() {
    console.log("Testing Stripe Connection...");
    try {
        const intent = await createPaymentIntent(50, 'brl', { ticketId: 'test', userId: 'test' });
        console.log("Success! Payment Intent ID:", intent.id);
    } catch (error: any) {
        console.error("Stripe Error:", error.message);
        if (error.type) console.error("Type:", error.type);
        if (error.code) console.error("Code:", error.code);
    }
}

test();

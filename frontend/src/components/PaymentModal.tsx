import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, Lock, CheckCircle } from 'lucide-react';

// Carrega o Stripe com a chave pública via variável de ambiente
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUB_KEY);

interface PaymentModalProps {
    clientSecret: string;
    total: number;
    itemCount: number;
    onClose: () => void;
    onSuccess: () => void;
}

// Componente interno que usa os hooks do Stripe (precisa estar dentro de <Elements>)
function CheckoutForm({ total, itemCount, onClose, onSuccess }: Omit<PaymentModalProps, 'clientSecret'>) {
    const stripe = useStripe();
    const elements = useElements();
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setStatus('processing');
        setErrorMessage('');

        const result = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.origin, // Redireciona para a home após o pagamento
            },
            redirect: 'if_required', // Só redireciona se necessário (ex: 3D Secure)
        });

        if (result.error) {
            setErrorMessage(result.error.message || 'Erro ao processar pagamento.');
            setStatus('error');
        } else if (result.paymentIntent?.status === 'succeeded') {
            setStatus('success');
            setTimeout(() => {
                onSuccess();
            }, 2000);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Pagamento</h2>
                    <p className="text-sm text-gray-500">{itemCount} ingresso(s) • R$ {total.toFixed(2)}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Stripe Payment Element */}
            <div className="bg-gray-50 p-4 rounded-lg border">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                    }}
                />
            </div>

            {/* Status Messages */}
            {status === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                    {errorMessage}
                </div>
            )}

            {status === 'success' && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center gap-3">
                    <CheckCircle size={24} />
                    <div>
                        <p className="font-bold">Pagamento Confirmado!</p>
                        <p className="text-sm">Seus ingressos estão garantidos.</p>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={!stripe || status === 'processing' || status === 'success'}
                className={`w-full py-4 text-lg font-bold rounded-lg shadow-lg transition flex items-center justify-center gap-2 ${status === 'processing'
                    ? 'bg-yellow-500 cursor-not-allowed text-black'
                    : status === 'success'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 hover:bg-black text-white'
                    }`}
            >
                {status === 'idle' && (
                    <>
                        <Lock size={18} />
                        Pagar R$ {total.toFixed(2)}
                    </>
                )}
                {status === 'processing' && 'Processando...'}
                {status === 'success' && '✓ Pago com Sucesso!'}
                {status === 'error' && 'Tentar Novamente'}
            </button>

            {/* Security Badge */}
            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                <Lock size={12} /> Pagamento seguro via Stripe
            </p>
        </form>
    );
}

// Componente wrapper que inicializa o Stripe Elements
export function PaymentModal({ clientSecret, total, itemCount, onClose, onSuccess }: PaymentModalProps) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
                <Elements
                    stripe={stripePromise}
                    options={{
                        clientSecret,
                        appearance: {
                            theme: 'stripe',
                            variables: {
                                colorPrimary: '#dc2626', // red-600
                                borderRadius: '8px',
                            },
                        },
                    }}
                >
                    <CheckoutForm
                        total={total}
                        itemCount={itemCount}
                        onClose={onClose}
                        onSuccess={onSuccess}
                    />
                </Elements>
            </div>
        </div>
    );
}
